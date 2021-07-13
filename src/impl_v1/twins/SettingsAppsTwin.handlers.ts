import {
  SettingsDefineEvent,
  SettingsSetEvent,
  SettingsSetPartialEvent,
  SettingsState,
} from './SettingsAppsTwin'
import bEx from 'brace-expansion'
import clone from 'clone'
import Ajv from 'ajv'
import { migrateSettings } from './SettingsAppsTwin.migration'

export const handleDefineSettings = <T>(
  state: SettingsState<T>,
  event: SettingsDefineEvent<T>,
  lastUpdate: number,
): SettingsState<T> => {
  try {
    const validate = new Ajv().validateSchema(JSON.parse(event.schema))
    if (validate) {
      if (!state.defined) {
        return {
          defined: true,
          setting: event.defaultSettings,
          lastUpdate,
          schema: event.schema,
          version: 1,
        }
      } else {
        return {
          defined: true,
          setting: migrateSettings(state.setting, event.migration, event.defaultSettings),
          lastUpdate,
          schema: event.schema,
          version: state.version + 1,
        }
      }
    } else {
      console.error('failed to validate settings')
      return state
    }
  } catch (e) {
    console.error('failed to parse or validate settings schema', e)
    return state
  }
}

export const handleSettingsSet = <T>(
  state: SettingsState<T>,
  event: SettingsSetEvent<T>,
): SettingsState<T> => {
  if (state.defined) {
    try {
      const validate = new Ajv().validateSchema(JSON.parse(state.schema))
      if (validate) {
        event.setting = event.setting
        state.version += 1
      } else {
        console.error('failed to validate settings')
        return state
      }
    } catch (e) {
      console.error('failed to parse or validate settings schema', e)
      return state
    }
  }
  return state
}

export const handleSettingsSetPartial = <T>(
  state: SettingsState<T>,
  event: SettingsSetPartialEvent,
): SettingsState<T> => {
  if (state.defined) {
    const scopes = bEx(event.scope)
    // console.log('set partial ', scopes, event.value)
    const modSetting = clone(state.setting)
    scopes.forEach((scope) => {
      let settingsPtr: any = modSetting
      const path = scope.split('.')
      const last = path.pop()
      for (const prop of path) {
        const next = settingsPtr[prop]
        if (next) {
          settingsPtr = next
        } else {
          break
        }
      }
      if (settingsPtr && last) {
        settingsPtr[last] = event.value
      }
    })
    const validate = new Ajv().compile(JSON.parse(state.schema))
    const valid = validate(modSetting)

    if (!valid) {
      console.log('failed to set settings', validate.errors)
      return state
    }

    state.setting = modSetting
    state.version += 1
  }
  return state
}