import clone from 'clone'
import { MigrationScript, Migration as MigrationType } from '../..'
import { isArray, isNull, isObject, isSameType } from './SettingsAppsTwin.utils'

export const Migration = {
  script: <C, T>(
    migration: MigrationScript<C, T>,
    addMissingProperties: boolean = true,
  ): MigrationType => {
    return {
      type: 'migrationScript',
      script: migration.toString(),
      addMissingProperties,
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
}

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
      const script = eval(migration.script)
      const migrated: N = script(setting, defSettings)
      return migration.addMissingProperties
        ? migrateSettings(migrated, Migration.addMissingProperties(), defSettings)
        : migrated
    }
    default:
      return defSettings
  }
}
