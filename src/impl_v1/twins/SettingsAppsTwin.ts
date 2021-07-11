import { Fish, FishId, Tag, Tags } from '@actyx/pond'
import { Schema } from '../..'

type SettingsState<T> =
  | {
      defined: true
      version: number
      config: T
      schema: Schema<T>
      lastUpdate: number
    }
  | {
      defined: false
    }

type AppsState = {
  peers: Record<string, string>
  schema: any
  defaultSettings: any[]
  migrations: any[]
}

export type SettingsConfigAppliedEvent = {
  eventType: 'settingsConfigApplied'
  appId: string
  peer: string
  version: number
}
export type SettingsConfigDefineEvent<T> = {
  eventType: 'settingsConfigDefine'
  appId: string
  schema: any
  defaultSettings: T
  migration: any
}
export type SettingsConfigSetEvent<T> = {
  eventType: 'settingsConfigSet'
  appId: string
  peer: string
  setting: T
}
export type SettingsConfigSetPartialEvent = {
  eventType: 'settingsConfigSetPartial'
  appId: string
  peer: string
  scope: string
  value: unknown
}
export type PeerEvent<T> = SettingsConfigSetEvent<T> | SettingsConfigSetPartialEvent

export type AppEvent<T> = SettingsConfigAppliedEvent | SettingsConfigDefineEvent<T>

export type Event<T> = PeerEvent<T> | AppEvent<T>

type Emitter<E> = (tags: Tags<E>, event: E) => any

const emitSettingsConfigApplied = <EM extends Emitter<AppEvent<unknown>>>(
  emit: EM,
  appId: string,
  peer: string,
  version: number,
): ReturnType<EM> =>
  emit(settingsAppTagFn(appId), {
    eventType: 'settingsConfigApplied',
    appId,
    peer,
    version,
  })

const emitSettingsConfigDefine = <T, EM extends Emitter<Event<T>>>(
  emit: EM,
  appId: string,
  schema: any,
  defaultSettings: T,
  migration: any,
): ReturnType<EM> =>
  emit(settingsAppTagFn<T>(appId).and(settingsDefinitionTagFn(appId)), {
    eventType: 'settingsConfigDefine',
    appId,
    schema,
    defaultSettings,
    migration,
  })

const emitSettingsConfigSet = <T, EM extends Emitter<Event<T>>>(
  emit: EM,
  appId: string,
  peer: string,
  setting: T,
): ReturnType<EM> =>
  emit(settingsPeerTagFn<T>(appId, peer), {
    eventType: 'settingsConfigSet',
    appId,
    peer,
    setting,
  })

const emitSettingsConfigSetPartial = <T, EM extends Emitter<Event<unknown>>>(
  emit: EM,
  appId: string,
  peer: string,
  scope: string,
  value: unknown,
): ReturnType<EM> =>
  emit(settingsPeerTagFn<T>(appId, peer), {
    eventType: 'settingsConfigSetPartial',
    appId,
    peer,
    scope,
    value,
  })

export const settingsAppTag = Tag<AppEvent<unknown>>('settings.app')
export const settingsAppTagFn = <T = unknown>(appId: string) =>
  settingsAppTag.withId(appId) as Tag<AppEvent<T>>
export const settingsDefinitionTagFn = <T = unknown>(appId: string) =>
  Tag<SettingsConfigDefineEvent<T>>('settings.config.app.definition').withId(appId)
export const settingsPeerTagFn = <T = unknown>(appId: string, peer: string) =>
  Tag<PeerEvent<T>>(`settings.peer:${appId}:${peer}`)

type PeerTwinProps = {
  appId: string
  peer: string
}

export const AppSettingsTwins = {
  // Tags
  tags: {},
  // Twins
  allApps: (): Fish<Record<string, boolean>, AppEvent<unknown>> => ({
    fishId: FishId.of('config.setting.app.allApps', 'all', 0),
    initialState: {},
    where: settingsAppTag,
    onEvent: (state, event) => {
      if (event.eventType === 'settingsConfigDefine') {
        state[event.appId] = true
      }
      return state
    },
  }),

  app: (appId: string): Fish<AppsState, AppEvent<unknown>> => ({
    fishId: FishId.of('config.setting.app.appTwin', appId, 0),
    initialState: {
      peers: {},
      defaultSettings: [],
      migrations: [],
      schema: [],
    },
    where: settingsAppTagFn(appId),
    onEvent: (state, event) => {
      switch (event.eventType) {
        case 'settingsConfigApplied':
          state.peers[event.peer] = `${event.version}`
          return state
      }
      return state
    },
  }),
  peer: <T>({
    appId,
    peer,
  }: PeerTwinProps): Fish<SettingsState<T>, PeerEvent<T> | SettingsConfigDefineEvent<T>> => ({
    fishId: FishId.of(
      'config.setting.app.peer',
      Buffer.from(appId).toString('base64') + ':' + Buffer.from(peer).toString('base64'),
      0,
    ),
    initialState: {
      defined: false,
    },
    where: settingsPeerTagFn<T>(appId, peer).or(settingsDefinitionTagFn(appId)),
    onEvent: (state, event, { timestampMicros }) => {
      switch (event.eventType) {
        case 'settingsConfigDefine':
          return {
            defined: true,
            config: event.defaultSettings,
            lastUpdate: timestampMicros,
            schema: event.schema,
            version: state.defined ? state.version + 1 : 1,
          }
        case 'settingsConfigSet':
          if (state.defined) {
            event.setting = event.setting
            state.version += 1
          }
          return state
        case 'settingsConfigSetPartial':
          if (state.defined) {
            state.version += 1
          }
          return state
      }
      return state
    },
  }),

  // Emitters
  emitSettingsConfigApplied,
  emitSettingsConfigDefine,
  emitSettingsConfigSet,
  emitSettingsConfigSetPartial,
}
