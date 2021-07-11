import { CancelSubscription, Pond } from '@actyx/pond'

export type SettingsFactory = (actyx: Pond) => Settings

export type Schema<T> = string

export type PeerResponseSucceeded = {
  response: 'succeeded'
  updatedPeers: string[]
}
export type PeerResponsePartial = {
  response: 'partial'
  updatedPeers: string[]
  missingPeers: string[]
}
export type PeerResponseNoResponse = {
  response: 'noResponse'
  missingPeers: string[]
}
export type PeerResponse = PeerResponseSucceeded | PeerResponsePartial | PeerResponseNoResponse

export type AppSettings<T> = {
  listPeers: () => Promise<ReadonlyArray<string>>
  listPeerVersions: () => Promise<Record<string, number>>
  getSchema: <T>(peer: string) => Promise<Schema<T> | undefined>

  defineSettings: (
    schema: Schema<T>,
    defaultSetting: T,
    migration: unknown,
    timeout?: number,
  ) => Promise<PeerResponse>
  verifySettings: (
    schema: Schema<T>,
    defaultSetting: T,
    migration: unknown,
  ) => Promise<Record<string, boolean>>
  set: (
    peers: string | string[],
    value: any,
    scope?: string,
    timeout?: number,
  ) => Promise<PeerResponse>
  unset: (peers: string | string[], scope: string, timeout?: number) => Promise<PeerResponse>

  subscribe: (peer: string, cb: (settings: T | undefined) => boolean) => CancelSubscription
  get: (peer: string) => Promise<T | undefined>
}

export type Settings = {
  app: <T>(application: string) => AppSettings<Readonly<T>>
  listApps: () => Promise<ReadonlyArray<string>>
}
