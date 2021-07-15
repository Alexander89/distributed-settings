import { Fish, FishId, Tag, Tags } from '@actyx/pond'
import { Migration, Schema } from '../..'
import {
  handleDefineSettings,
  handleSettingsSet,
  handleSettingsSetPartial,
} from './SettingsAppsTwin.handlers'

export type SettingsState<T> =
  | {
      defined: true
      version: number
      setting: T
      schema: Schema
      lastUpdate: number
    }
  | {
      defined: false
    }

export type AppsState<T> = {
  peers: Record<string, number>
  schema: true | object
  defaultSettings: T | undefined
  migrations: Migration
}

export type SettingsAppliedEvent = {
  eventType: 'settingsApplied'
  appId: string
  peer: string
  version: number
}
export type SettingsDefineEvent<T> = {
  eventType: 'settingsDefine'
  appId: string
  schema: Schema
  defaultSettings: T
  migration: Migration
}
export type SettingsSetEvent<T> = {
  eventType: 'settingsSet'
  appId: string
  peer: string
  setting: T
}
export type SettingsSetPartialEvent = {
  eventType: 'settingsSetPartial'
  appId: string
  peer: string
  scope: string
  value: unknown
}
export type PeerEvent<T> = SettingsSetEvent<T> | SettingsSetPartialEvent

export type AppEvent<T> = SettingsAppliedEvent | SettingsDefineEvent<T>

export type Event<T> = PeerEvent<T> | AppEvent<T>

type Emitter<E> = (tags: Tags<E>, event: E) => any

const emitSettingsApplied = <EM extends Emitter<AppEvent<unknown>>>(
  emit: EM,
  appId: string,
  peer: string,
  version: number,
): ReturnType<EM> =>
  emit(settingsAppTagFn(appId), {
    eventType: 'settingsApplied',
    appId,
    peer,
    version,
  })

const emitSettingsDefine = <T, EM extends Emitter<Event<T>>>(
  emit: EM,
  appId: string,
  schema: any,
  defaultSettings: T,
  migration: any,
): ReturnType<EM> =>
  emit(settingsAppTagFn<T>(appId).and(settingsDefinitionTagFn(appId)), {
    eventType: 'settingsDefine',
    appId,
    schema,
    defaultSettings,
    migration,
  })

const emitSettingsSet = <T, EM extends Emitter<Event<T>>>(
  emit: EM,
  appId: string,
  peer: string,
  setting: T,
): ReturnType<EM> =>
  emit(settingsPeerTagFn<T>(appId, peer), {
    eventType: 'settingsSet',
    appId,
    peer,
    setting,
  })

const emitSettingsSetPartial = <T, EM extends Emitter<Event<unknown>>>(
  emit: EM,
  appId: string,
  peer: string,
  scope: string,
  value: unknown,
): ReturnType<EM> =>
  emit(settingsPeerTagFn<T>(appId, peer), {
    eventType: 'settingsSetPartial',
    appId,
    peer,
    scope,
    value,
  })

export const settingsAppTag = Tag<AppEvent<unknown>>('settings.app')
export const settingsAppTagFn = <T = unknown>(appId: string) =>
  settingsAppTag.withId(appId) as Tag<AppEvent<T>>
export const settingsDefinitionTagFn = <T = unknown>(appId: string) =>
  Tag<SettingsDefineEvent<T>>('settings.app.definition').withId(appId)
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
    fishId: FishId.of('setting.app.allApps', 'all', 0),
    initialState: {},
    where: settingsAppTag,
    onEvent: (state, event) => {
      if (event.eventType === 'settingsDefine') {
        state[event.appId] = true
      }
      return state
    },
  }),

  app: <T>(appId: string): Fish<AppsState<T>, AppEvent<T>> => ({
    fishId: FishId.of('setting.app.appTwin', appId, 0),
    initialState: {
      peers: {},
      defaultSettings: undefined,
      migrations: {
        type: 'resetToDefault',
      },
      schema: true,
    },
    where: settingsAppTagFn(appId),
    onEvent: (state, event) => {
      switch (event.eventType) {
        case 'settingsApplied':
          state.peers[event.peer] = event.version
          return state
        case 'settingsDefine':
          state.defaultSettings = event.defaultSettings
          state.migrations = event.migration
          state.schema = event.schema
          console.log(state)
          return state
      }
      return state
    },
  }),
  peer: <T>({
    appId,
    peer,
  }: PeerTwinProps): Fish<SettingsState<T>, PeerEvent<T> | SettingsDefineEvent<T>> => ({
    fishId: FishId.of(
      'setting.app.peer',
      Buffer.from(appId).toString('base64') + ':' + Buffer.from(peer).toString('base64'),
      0,
    ),
    initialState: {
      defined: false,
    },
    where: settingsPeerTagFn<T>(appId, peer).or(settingsDefinitionTagFn(appId)),
    onEvent: (state, event, { timestampMicros }) => {
      switch (event.eventType) {
        case 'settingsDefine':
          return handleDefineSettings(state, event, timestampMicros)
        case 'settingsSet':
          return handleSettingsSet(state, event)
        case 'settingsSetPartial':
          return handleSettingsSetPartial(state, event)
      }
      console.log('event ignored', event)
      return state
    },
  }),

  // Emitters
  emitSettingsApplied,
  emitSettingsDefine,
  emitSettingsSet,
  emitSettingsSetPartial,
}
