import { CancelSubscription, Pond } from '@actyx/pond'
import {
  Settings as SettingsType,
  AppSettings,
  Schema,
  SettingsFactory,
  PeerResponse,
} from '../index'
import bEx from 'brace-expansion'

import { AppSettingsTwins } from './twins/SettingsAppsTwin'
import { checkForUpdate, collectPeerVersionsOnce, getCurrentState, parsePeersParam } from './utils'

const defaultTimeout = 10000

export const Settings: SettingsFactory = (actyx: Pond): SettingsType => {
  const listApps = (): Promise<string[]> =>
    getCurrentState(actyx, AppSettingsTwins.allApps()).then(Object.keys)
  const app = appSettings(actyx)

  return {
    app,
    listApps,
  }
}

const appSettings =
  (actyx: Pond) =>
  <T>(appId: string): AppSettings<T> => {
    const listPeers = (): Promise<string[]> => listPeerVersions().then(Object.keys)

    const listPeerVersions = (): Promise<Record<string, number>> =>
      new Promise((res, rej) => {
        const done = actyx.observe(
          AppSettingsTwins.app(appId),
          (state) => {
            done()
            res(state.peers)
          },
          rej,
        )
      })

    const verifySettings = <T>(
      _schema: Schema,
      _defaultSetting: T,
      _migration: unknown,
    ): Promise<Record<string, boolean>> => Promise.resolve({})

    const defineSettings = async <T>(
      schema: Schema,
      defaultSetting: T,
      migration: unknown,
      timeout: number = defaultTimeout,
    ): Promise<PeerResponse> => {
      console.log(schema, defaultSetting, migration, timeout)
      const res = await verifySettings(schema, defaultSetting, migration)
      if (!Object.values(res).every((v) => v === true)) {
        throw new Error('setting not valide for all peers: ' + JSON.stringify(res))
      }
      const peers = await listPeers()

      console.log(schema, defaultSetting, migration)
      const currentState = await collectPeerVersionsOnce(peers, actyx, appId)
      AppSettingsTwins.emitSettingsDefine(actyx.emit, appId, schema, defaultSetting, migration)
      return checkForUpdate(actyx, appId, currentState, timeout)
    }

    const getSchema = <T>(): Promise<Schema | undefined> =>
      getCurrentState(actyx, AppSettingsTwins.app<T>(appId))
        .then((state) => state.schema)
        .catch(() => undefined)

    const getDefaultSettings = <T>(): Promise<T | undefined> =>
      getCurrentState(actyx, AppSettingsTwins.app<T>(appId))
        .then((state) => state.defaultSettings)
        .catch(() => undefined)

    const subscribe = <T>(
      peer: string,
      sub: (settings: T | undefined) => boolean | Promise<boolean>,
    ): CancelSubscription =>
      actyx.observe(AppSettingsTwins.peer<T>({ appId, peer }), async (state) => {
        let res = sub(state.defined ? state.setting : undefined)
        if (typeof res !== 'boolean') {
          res = await res
        }
        if (res) {
          AppSettingsTwins.emitSettingsApplied(
            actyx.emit,
            appId,
            peer,
            state.defined ? state.version : 0,
          )
        }
      })

    const get = <T>(peer: string, doNotAck: boolean = false): Promise<T | undefined> =>
      getCurrentState(actyx, AppSettingsTwins.peer<T>({ appId, peer }))
        .then((state) => {
          if (state.defined) {
            if (doNotAck === false) {
              AppSettingsTwins.emitSettingsApplied(actyx.emit, appId, peer, state.version)
            }
            return state.setting
          } else {
            return undefined
          }
        })
        .catch(() => undefined)

    const set = async <T>(
      peers: string | string[],
      value: T,
      scope?: string,
      timeout: number = defaultTimeout,
    ): Promise<PeerResponse> => {
      const parsedPeers = parsePeersParam(peers)
      // const parsedScope = scope ? bEx(scope) : undefined

      const currentState = await collectPeerVersionsOnce(parsedPeers, actyx, appId)

      parsedPeers.forEach((peer) =>
        scope
          ? AppSettingsTwins.emitSettingsSetPartial(actyx.emit, appId, peer, scope, value)
          : AppSettingsTwins.emitSettingsSet(actyx.emit, appId, peer, value),
      )

      return checkForUpdate(actyx, appId, currentState, timeout)
    }

    const unset = async (
      peers: string | string[],
      scope: string,
      timeout: number = defaultTimeout,
    ): Promise<PeerResponse> => {
      const parsedPeers = parsePeersParam(peers)
      const parsedScope = scope ? bEx(scope) : undefined
      const currentState = await collectPeerVersionsOnce(parsedPeers, actyx, appId)
      console.log('unset', parsedPeers, parsedScope)
      return checkForUpdate(actyx, appId, currentState, timeout)
    }

    return {
      listPeers,
      listPeerVersions,
      get,
      defineSettings,
      verifySettings,
      getSchema,
      getDefaultSettings,
      subscribe,
      set,
      unset,
    }
  }
