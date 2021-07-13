import {
  SettingsDefineEvent,
  SettingsSetEvent,
  SettingsSetPartialEvent,
  SettingsState,
} from './SettingsAppsTwin'
import bEx from 'brace-expansion'
import clone from 'clone'
import Ajv from 'ajv'
import { MigrationScript, Migration as MigrationType } from '../..'
import { isArray, isNull, isObject, isSameType } from './SettingsAppsTwin.utils'

export const Migration = {
  of: <T, C>(migration: MigrationScript<T, C>): MigrationType => {
    return {
      type: 'migrationScript',
      script: migration.toString(),
    }
  },
  addMissingProperties: (): MigrationType => ({
    type: 'addMissingProperties',
  }),
  resetToDefault: (): MigrationType => ({
    type: 'resetToDefault',
  }),
}

export const addMigrateProperties = <T>(currentSettings: unknown, resSettingsRef: T): T => {
  if (isArray(resSettingsRef)) {
    if (isSameType(currentSettings, resSettingsRef)) {
      // resSettingsRef and currentSettings are arrays, travel through the values and migrate each
      // of them to the new style.
      //
      // if the current array is larger than the new default settings, the last value in the default
      // settings are used to migrate the rest of the current settings
      const additionalEntries = resSettingsRef.slice(currentSettings.length)
      const migratedEntries = currentSettings.map((s, idx) =>
        addMigrateProperties(
          s,
          idx < resSettingsRef.length
            ? resSettingsRef[idx]
            : resSettingsRef[resSettingsRef.length - 1],
        ),
      )
      return [...migratedEntries, ...additionalEntries] as any as T
    } else {
      return resSettingsRef
    }
  } else if (isNull(currentSettings)) {
    return resSettingsRef
  } else if (isObject(resSettingsRef)) {
    if (isObject(currentSettings)) {
      return Object.entries(currentSettings)
        .filter(([name]) => Object.keys(resSettingsRef).includes(name))
        .reduce(
          (acc, [name, value]) => ({
            ...acc,
            [name]: addMigrateProperties(value, resSettingsRef[name]),
          }),
          resSettingsRef,
        )
    } else {
      return resSettingsRef
    }
  } else {
    return isSameType(currentSettings, resSettingsRef) ? currentSettings : resSettingsRef
  }

  // Object.entries(currentSettings).forEach(([key, value]) => {
  //   if (value === undefined) {
  //     resSettingsRef[key] = {} as any
  //     migrateSub(oldSettings, value, resSettingsRef[key] as Record<string, unknown>)
  //   } else if (typeof resSettingsRef[key] === 'object') {
  //     migrateSub(oldSettings, value, resSettingsRef[key] as Record<string, unknown>)
  //   } else {
  //     console.log(value, resSettingsRef[key])
  //     resSettingsRef[key] = eval(`oldSetting.${migration[key]}`)
  //   }
  // })
  // return resSettingsRef
}

/*
export const merge = (
  currentSettings: unknown, // Record<string, unknown> | Array<unknown>,
  resSettingsRef: unknown, // Record<string, unknown> | Array<unknown>,
): any => {
  if (isArray(resSettingsRef)) {
    return resSettingsRef.map(resSettingsRef)
  } else if (isNull(resSettingsRef)) {
  } else if (isObject(resSettingsRef)) {
  } else {
    return resSettingsRef
  }
  Object.entries(currentSettings).forEach(([key, value]) => {
    if (value === undefined) {
      return merge(value, resSettingsRef[key])
    } else if (typeof resSettingsRef[key] === 'object') {
      return merge(value, resSettingsRef[key])
    } else {
      console.log(currentSettings, resSettingsRef)
    }
  })
}
*/

export const migrateSettings = <C, N>(
  setting: C,
  migration: MigrationType,
  defaultSettings: N,
): N => {
  const defSettings = clone(defaultSettings)

  switch (migration.type) {
    case 'resetToDefault': {
      return defSettings
    }
    case 'addMissingProperties': {
      return addMigrateProperties(setting, defSettings)
    }
    case 'migrationScript': {
      console.error('do migrationScript')
      return defSettings
    }
    default:
      return defSettings
  }
}

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
