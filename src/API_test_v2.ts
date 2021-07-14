import { CancelSubscription, Pond } from '@actyx/pond'
import bEx from 'brace-expansion'
import {
  Settings as SettingsType,
  AppSettings,
  Schema,
  SettingsFactory,
  PeerResponse,
} from './index'

/**
 * TEST impl
 */

export const Settings: SettingsFactory = (actyx: Pond): SettingsType => ({
  app: appSettings(actyx),
  listApps: () => Promise.resolve(['app1']),
})

const appSettings =
  (_actyx: Pond) =>
  <T>(_app: string): AppSettings<T> => ({
    listPeers: () =>
      Promise.resolve(['Win-PC-001', 'Win-PC-002', 'Ipc-M1-001', 'Ipc-M2-001', 'Server-VM1-001']),
    listPeerVersions: (): Promise<Record<string, number>> => {
      return Promise.resolve({
        'Win-PC-001': 2,
        'Win-PC-002': 2,
        'Ipc-M1-001': 3,
        'Ipc-M2-001': 4,
        'Server-VM1-001': 4,
      })
    },
    getSchema: (): Promise<Schema | undefined> =>
      Promise.resolve(
        JSON.stringify({
          default: {},
        }),
      ),

    subscribe: <T>(
      _peer: string,
      sub: (settings: T | undefined) => boolean,
    ): CancelSubscription => {
      const timer1 = setTimeout(() => {
        if (sub({ machineName: 'Machine 1', plcIp: '192.168.199.29' } as any as T)) {
          console.log('setting applied')
        }
      }, 1_000)
      const timer2 = setTimeout(() => {
        if (sub({ machineName: 'Machine 1', plcIp: '192.168.199.30' } as any as T)) {
          console.log('setting applied')
        }
      }, 15_000)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    },
    get: <T>(_peer: string): T =>
      ({ machineName: 'Machine 1', plcIp: '192.168.199.29' } as any as T),

    defineSettings: <T>(
      _schema: Schema,
      _defaultSetting: T,
      _migration: unknown,
    ): Promise<PeerResponse> =>
      Promise.resolve({ response: 'succeeded', updatedPeers: ['peerName'] }),
    verifySettings: <T>(
      _schema: Schema,
      _defaultSetting: T,
      _migration: unknown,
    ): Promise<Record<string, boolean>> => Promise.resolve({ peerNameA: true, peerNameB: false }),
    set: (
      peers: string | string[],
      _value: any,
      scope?: string,
      _timeout: number = 15000,
    ): Promise<PeerResponse> => {
      const parsedPeers = Array.isArray(peers) ? peers : bEx(peers)
      const parsedScope = scope ? bEx(scope) : undefined
      console.log('set', parsedPeers, parsedScope)
      return Promise.resolve({ response: 'succeeded', updatedPeers: parsedPeers })
    },
    unset: (
      peers: string | string[],
      scope: string,
      _timeout: number = 15000,
    ): Promise<PeerResponse> => {
      const parsedPeers = Array.isArray(peers) ? peers : bEx(peers)
      const parsedScope = scope ? bEx(scope) : undefined
      console.log('unset', parsedPeers, parsedScope)
      return Promise.resolve({ response: 'succeeded', updatedPeers: parsedPeers })
    },
  })
