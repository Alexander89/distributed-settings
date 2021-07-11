import { Pond, Tags } from '@actyx/pond'
import {
  AppSettingsTwins,
  settingsAppTagFn,
  SettingsConfigAppliedEvent,
  SettingsConfigDefineEvent,
  SettingsConfigSetEvent,
  SettingsConfigSetPartialEvent,
  settingsDefinitionTagFn,
  settingsPeerTagFn,
} from './twins/SettingsAppsTwin'
import {
  allLargerThan,
  checkForUpdate,
  collectPeerVersions,
  collectPeerVersionsOnce,
  getCurrentState,
  parsePeersParam,
  sub,
} from './utils'

const delay = (t: number) => new Promise<void>((res) => setTimeout(() => res(), t))

describe('utils', () => {
  it('getCurrentState', async () => {
    const pond = Pond.test()
    const fakeState = { a: 2, b: 5 }
    const cancelSpy = jest.fn()
    const observeSpy = spyOn(pond, 'observe').and.callFake((_fish, cb) => {
      delay(5).then(() => cb(fakeState))
      return cancelSpy
    })

    const state = await getCurrentState(
      pond,
      AppSettingsTwins.peer<unknown>({ appId: 'a', peer: 'b' }),
    )

    await delay(10)

    expect(state).toStrictEqual(fakeState)
    expect(observeSpy).toHaveBeenCalledTimes(1)
    expect(cancelSpy).toHaveBeenCalledTimes(1)
  })
  it('allLargerThan', () => {
    expect(allLargerThan({ a: 1, b: 1 }, 1)).toBeFalsy()
    expect(allLargerThan({ a: 1, b: 2 }, 1)).toBeFalsy()
    expect(allLargerThan({ a: 2, b: 2 }, 2)).toBeFalsy()
    expect(allLargerThan({ a: 1, b: 1 }, 0)).toBeTruthy()
    expect(allLargerThan({ a: 1, b: 2 }, 0)).toBeTruthy()
    expect(allLargerThan({ a: 2, b: 2 }, 1)).toBeTruthy()
  })

  it('sub', () => {
    expect(sub({ a: 1, b: 1 }, { a: 1, b: 1 })).toStrictEqual({ a: 0, b: 0 })
    expect(sub({ a: 5, b: 4 }, { a: 3, b: 2 })).toStrictEqual({ a: 2, b: 2 })
    expect(sub({ a: 5, b: 4 }, { b: 3, c: 2 })).toStrictEqual({ a: 5, b: 1, c: -2 })
    expect(sub({ a: 5, b: undefined }, { b: 3, c: 2 })).toStrictEqual({ a: 5, b: -3, c: -2 })
    expect(sub({ a: 5, b: 4 }, { b: undefined, c: 2 })).toStrictEqual({ a: 5, b: 4, c: -2 })
    expect(sub({ a: 5, b: undefined }, { b: undefined, c: 2 })).toStrictEqual({
      a: 5,
      b: undefined,
      c: -2,
    })
    expect(sub({ a: 5, b: undefined }, { b: 3, c: undefined })).toStrictEqual({
      a: 5,
      b: -3,
      c: undefined,
    })
  })

  it('collectPeerVersions', async () => {
    const actyx = Pond.test()
    const appId = 'appTest'

    actyx.directlyPushEvents([
      mkDefineEvent(0, appId),
      mkSetEvent(1, appId, 'test1', 'Set'),
      mkAppliedEvent(2, appId, 'test1', 2),
      mkSetEvent(3, appId, 'test2', 'Set'),
      mkSetEvent(4, appId, 'test2', 'Set'),
      mkAppliedEvent(5, appId, 'test2', 3),
      mkSetPartialEvent(6, appId, 'test2', 'test.scope', 'value'),
      mkAppliedEvent(7, appId, 'test2', 4),
    ])

    const versions = await new Promise((res) => {
      const c = collectPeerVersions(['test1', 'test2'], actyx, appId, (v) => {
        c()
        res(v)
      })
    })

    expect(versions).toStrictEqual({ test1: 2, test2: 4 })
  })
  it('collectPeerVersions - no event', async () => {
    const actyx = Pond.test()
    const appId = 'appTest'

    const versions = await new Promise((res) => {
      const c = collectPeerVersions(['test1', 'test2'], actyx, appId, (v) => {
        c()
        res(v)
      })
    })

    expect(versions).toStrictEqual({ test1: undefined, test2: undefined })
  })

  it('collectPeerVersionsOnce', async () => {
    const actyx = Pond.test()
    const appId = 'appTest'

    actyx.directlyPushEvents([
      mkDefineEvent(0, appId),
      mkAppliedEvent(1, appId, 'test1', 1),
      mkAppliedEvent(2, appId, 'test2', 1),
      mkSetEvent(3, appId, 'test1', 'Set'),
      mkAppliedEvent(4, appId, 'test1', 2),
      mkSetEvent(5, appId, 'test2', 'Set'),
      mkAppliedEvent(6, appId, 'test2', 2),
    ])

    const res = await collectPeerVersionsOnce(['test1', 'test2'], actyx, appId)

    expect(res).toStrictEqual({ test1: 2, test2: 2 })
  })
  it('collectPeerVersionsOnce - observe Failed', async () => {
    const actyx = Pond.test()
    const appId = 'appTest'
    spyOn(actyx, 'observe').and.throwError('some error')

    const res = await collectPeerVersionsOnce(['test1', 'test2'], actyx, appId)
    expect(res).toStrictEqual({ test1: undefined, test2: undefined })
  })
  it('collectPeerVersionsOnce - no event', async () => {
    const actyx = Pond.test()
    const appId = 'appTest'

    const res = await collectPeerVersionsOnce(['test1'], actyx, appId)
    expect(res).toStrictEqual({ test1: undefined })
  })

  it('parsePeersParam', () => {
    expect(parsePeersParam('host-name')).toStrictEqual(['host-name'])
    expect(parsePeersParam(['a', 'b'])).toStrictEqual(['a', 'b'])
    expect(parsePeersParam([])).toStrictEqual([])
    expect(parsePeersParam('host{1..3}-{win,linux}')).toStrictEqual([
      'host1-win',
      'host1-linux',
      'host2-win',
      'host2-linux',
      'host3-win',
      'host3-linux',
    ])
  })
  it('parsePeersParam - drop empty', () => {
    expect(parsePeersParam('')).toStrictEqual([])
    expect(parsePeersParam([''])).toStrictEqual([])
  })
  it('checkForUpdate', async () => {
    const actyx = Pond.test()
    const appId = 'appTest'

    actyx.directlyPushEvents([
      mkDefineEvent(0, appId),
      mkSetEvent(1, appId, 'test1', 'Set'),
      mkAppliedEvent(3, appId, 'test1', 2),
      mkSetEvent(2, appId, 'test2', 'Set'),
      mkAppliedEvent(4, appId, 'test2', 2),
    ])

    const res = await collectPeerVersionsOnce(['test1', 'test2'], actyx, appId)
    expect(res).toStrictEqual({ test1: 2, test2: 2 })

    actyx.directlyPushEvents([
      mkSetEvent(5, appId, 'test1', 'Set'),
      mkAppliedEvent(6, appId, 'test1', 3),
      mkSetEvent(7, appId, 'test2', 'Set'),
      mkAppliedEvent(8, appId, 'test2', 3),
    ])

    const res2 = await checkForUpdate(actyx, appId, res, 1000)
    expect(res2).toStrictEqual({
      response: 'succeeded',
      updatedPeers: ['test1', 'test2'],
    })
  })

  it('checkForUpdate - No Peers', async () => {
    const actyx = Pond.test()
    const appId = 'appTest'

    const res = await collectPeerVersionsOnce([], actyx, appId)
    expect(res).toStrictEqual({})

    const res2 = await checkForUpdate(actyx, appId, res, 1000)
    expect(res2).toStrictEqual({
      response: 'noResponse',
      missingPeers: [],
    })
  })

  it('checkForUpdate - timeout no response', async () => {
    const actyx = Pond.test()
    const appId = 'appTest'

    actyx.directlyPushEvents([
      mkDefineEvent(0, appId),
      mkSetEvent(1, appId, 'test1', 'Set'),
      mkAppliedEvent(2, appId, 'test1', 2),
      mkSetEvent(3, appId, 'test2', 'Set'),
      mkAppliedEvent(4, appId, 'test2', 2),
    ])

    const res = await collectPeerVersionsOnce(['test1', 'test2'], actyx, appId)
    expect(res).toStrictEqual({ test1: 2, test2: 2 })

    const res2 = await checkForUpdate(actyx, appId, res, 1000)
    expect(res2).toStrictEqual({
      response: 'noResponse',
      missingPeers: ['test1', 'test2'],
    })
  })

  it('checkForUpdate - timeout partial response', async () => {
    const actyx = Pond.test()
    const appId = 'appTest'

    actyx.directlyPushEvents([
      mkDefineEvent(0, appId),
      mkSetEvent(1, appId, 'test1', 'Set'),
      mkAppliedEvent(2, appId, 'test1', 2),
      mkSetEvent(3, appId, 'test2', 'Set'),
      mkAppliedEvent(4, appId, 'test2', 2),
    ])

    const res = await collectPeerVersionsOnce(['test1', 'test2'], actyx, appId)
    expect(res).toStrictEqual({ test1: 2, test2: 2 })

    actyx.directlyPushEvents([
      mkSetEvent(5, appId, 'test1', 'Set'),
      mkAppliedEvent(6, appId, 'test1', 3),
    ])

    const res2 = await checkForUpdate(actyx, appId, res, 1000)
    expect(res2).toStrictEqual({
      response: 'partial',
      missingPeers: ['test2'],
      updatedPeers: ['test1'],
    })
  })
})

const mkDefineEvent = (i: number, appId: string) => ({
  lamport: i,
  offset: i,
  stream: 'a',
  tags: [
    ...toStringArray(settingsAppTagFn(appId)),
    ...toStringArray(settingsDefinitionTagFn(appId)),
  ],
  timestamp: Date.now(),
  payload: {
    appId,
    eventType: 'settingsConfigDefine',
    migration: '{mig}',
    defaultSettings: 'Hello Test',
    schema: '{}',
  } as SettingsConfigDefineEvent<string>,
})

const mkSetEvent = <T>(i: number, appId: string, peer: string, setting: T) => ({
  lamport: i,
  offset: i,
  stream: 'a',
  tags: toStringArray(settingsPeerTagFn<string>(appId, peer)),
  timestamp: Date.now(),
  payload: {
    eventType: 'settingsConfigSet',
    appId,
    peer,
    setting,
  } as SettingsConfigSetEvent<T>,
})

const mkSetPartialEvent = <T>(
  i: number,
  appId: string,
  peer: string,
  scope: string,
  value: unknown,
) => ({
  lamport: i,
  offset: i,
  stream: 'a',
  tags: toStringArray(settingsPeerTagFn<string>(appId, peer)),
  timestamp: Date.now(),
  payload: {
    eventType: 'settingsConfigSetPartial',
    appId,
    peer,
    scope,
    value,
  } as SettingsConfigSetPartialEvent,
})

const mkAppliedEvent = <T>(i: number, appId: string, peer: string, version: number) => ({
  lamport: i,
  offset: i,
  stream: 'a',
  tags: toStringArray(settingsAppTagFn(appId)),
  timestamp: Date.now(),
  payload: {
    eventType: 'settingsConfigApplied',
    appId,
    peer,
    version,
  } as SettingsConfigAppliedEvent,
})

const toStringArray = (t: Tags<any>) =>
  t
    .toString()
    .split('&')
    .map((s) => s.trim())
    .map((s) => s.substr(1, s.length - 2))

/*

const allLargerThan = (data: Record<string, number>, value: number): boolean =>
  Object.values(data).every((v) => v > value)

const sub = (a: Record<string, number>, b: Record<string, number>): Record<string, number> =>
  Object.entries(b).reduce<typeof a>((acc, [p, v]) => ({ ...acc, [p]: acc[p] || 0 - v }), a)
*/
