import { Pond } from '@actyx/pond'

type Schema<T> = string

export type AppSettings<T> = {
  listPeers: () => Promise<ReadonlyArray<string>>
  getSchema: <T>(peer: string) => Promise<Schema<T> | undefined>

  defineSettings: (schema: Schema<T>, defaultSetting: T, migration: unknown) => boolean
  set: (peers: string, value: any, scope?: string) => Promise<boolean>

  subscribe: (peer: string, cb: (settings: T | undefined) => void) => void
  get: (peer: string) => Promise<T | undefined>
}

export type Settings = {
  app: <T>(application: string) => AppSettings<Readonly<T>>
  listApps: () => Promise<ReadonlyArray<string>>
}

export const Settings = (actyx: Pond): Settings => ({
  app: appSettings(actyx),
  listApps: () => Promise.resolve(['app1']),
})

const appSettings =
  (actyx: Pond) =>
  <T>(app: string): AppSettings<T> => ({
    listPeers: () =>
      Promise.resolve(['Win-PC-001', 'Win-PC-002', 'Ipc-M1-001', 'Ipc-M2-001', 'Server-VM1-001']),
    getSchema: <T>(peer: string): Promise<Schema<T> | undefined> =>
      Promise.resolve(
        JSON.stringify({
          default: {},
        }),
      ),

    subscribe: <T>(peer: string, cb: (settings: T | undefined) => void): void => {
      setTimeout(() => cb({ machineName: 'Machine 1', plcIp: '192.168.199.29' } as any as T), 1_000)
      setTimeout(
        () => cb({ machineName: 'Machine 1', plcIp: '192.168.199.30' } as any as T),
        15_000,
      )
    },
    get: <T>(peer: string): Promise<T | undefined> =>
      Promise.resolve({ machineName: 'Machine 1', plcIp: '192.168.199.29' } as any as T),

    defineSettings: <T>(schema: Schema<T>, defaultSetting: T, migration: unknown): boolean => true,
    set: (peers: string, value: any, scope?: string): Promise<boolean> => Promise.resolve(true),
  })
