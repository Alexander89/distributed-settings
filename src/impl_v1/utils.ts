import { Pond, Fish, CancelSubscription } from '@actyx/pond'
import { PeerResponse } from '..'
import { AppSettingsTwins } from './twins/SettingsAppsTwin'
import bEx from 'brace-expansion'

export const getCurrentState = <S, E>(actyx: Pond, fish: Fish<S, E>): Promise<S> =>
  new Promise((res) => {
    const done = actyx.observe(fish, (s) =>
      setImmediate(() => {
        done()
        res(s)
      }),
    )
  })

export const collectPeerVersionsOnce = async <T>(
  parsedPeers: string[],
  actyx: Pond,
  appId: string,
) =>
  (
    await Promise.all(
      parsedPeers.map<Promise<{ [peer: string]: number | undefined }>>((peer) =>
        getCurrentState(actyx, AppSettingsTwins.peer<T>({ appId, peer }))
          .then((state) => ({ [peer]: state.defined ? state.version : undefined }))
          .catch(() => ({ [peer]: undefined })),
      ),
    )
  ).reduce((acc, p) => ({ ...acc, ...p }), {})

export const collectPeerVersions = <T>(
  parsedPeers: string[],
  actyx: Pond,
  appId: string,
  cb: (versions: Record<string, number | undefined>) => void,
): CancelSubscription => {
  type Mode = 'live' | 'collecting'
  let values: Record<string, number | undefined> = {}
  const checkMode = (values: Record<string, number | undefined>, peers: string[]): Mode =>
    Object.keys(values).length === peers.length ? 'live' : 'collecting'

  const cancels = parsedPeers.map((peer) =>
    actyx.observe(AppSettingsTwins.peer<T>({ appId, peer }), (state) => {
      values[peer] = state.defined ? state.version : undefined
      if (checkMode(values, parsedPeers) === 'live') {
        cb(values)
      }
    }),
  )

  return () => cancels.forEach((c) => c())
}

export type PeerVersion = Record<string, number | undefined>

export const allLargerThan = (data: PeerVersion, value: number): boolean =>
  Object.values(data).every((v) => v !== undefined && v > value)

export const sub = (a: PeerVersion, b: PeerVersion): PeerVersion =>
  Object.entries(b).reduce<typeof a>(
    (acc, [p, v]) => ({
      ...acc,
      [p]: acc[p] === undefined && v === undefined ? acc[p] : (acc[p] || 0) - (v || 0),
    }),
    a,
  )

export const checkForUpdate = (
  actyx: Pond,
  appId: string,
  currentState: PeerVersion,
  timeout: number,
): Promise<PeerResponse> => {
  const peers = Object.keys(currentState)
  if (peers.length === 0) {
    return Promise.resolve({
      response: 'noResponse',
      missingPeers: [],
    })
  }
  let cancelCollectPeerVersions = () => {}
  return new Promise<PeerResponse>((res) => {
    let lastUpdatesState = {}
    setTimeout(() => {
      cancelCollectPeerVersions()
      const entries = Object.entries(sub(lastUpdatesState, currentState))
      const succeeded = entries.filter(([_, v]) => v !== undefined && v > 0).map(([peer]) => peer)
      const failed = entries.filter(([_, v]) => v === undefined || v === 0).map(([peer]) => peer)

      if (succeeded.length === 0) {
        res({
          response: 'noResponse',
          missingPeers: failed,
        })
      } else {
        res({
          response: 'partial',
          missingPeers: failed,
          updatedPeers: succeeded,
        })
      }
    }, timeout)

    cancelCollectPeerVersions = collectPeerVersions(peers, actyx, appId, (newState) => {
      console.log(peers, appId, currentState, newState)
      lastUpdatesState = newState
      if (allLargerThan(sub(newState, currentState), 0)) {
        res({
          response: 'succeeded',
          updatedPeers: peers,
        })
      }
    })
  })
}

export const parsePeersParam = (peers: string | string[]): string[] =>
  Array.isArray(peers) ? peers.filter((s) => s !== '') : bEx(peers)
