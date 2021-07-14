import { Migration, migrateSettings } from './SettingsAppsTwin.migration'

describe('SettingsAppsTwin-migration', () => {
  const addMissingProperties = Migration.addMissingProperties()
  const resetToDefault = Migration.resetToDefault()

  describe('migrateSettings', () => {
    it('reset to default migration', () => {
      expect(migrateSettings(currentSettingsA, resetToDefault, newDefaultSettingsA)).toStrictEqual(
        resultResetSettingsA,
      )
    })
    it('add missing properties migration', () => {
      expect(
        migrateSettings(currentSettingsA, addMissingProperties, newDefaultSettingsA),
      ).toStrictEqual(resultAddMissingPropertiesA)
    })
    it('add more items to an array', () => {
      expect(
        migrateSettings(currentSettingsB, addMissingProperties, newDefaultSettingsB),
      ).toStrictEqual(resultAddMissingPropertiesMoreItemsInArrayB)
    })
    it('array as setting', () => {
      expect(
        migrateSettings(currentSettingsC, addMissingProperties, newDefaultSettingsC),
      ).toStrictEqual(resultWorkWithArraysC)
    })
    it('incompatible types should be replaced', () => {
      expect(migrateSettings(0, addMissingProperties, 'a')).toStrictEqual('a')
      expect(migrateSettings({ a: 1 }, addMissingProperties, 'a')).toStrictEqual('a')
      expect(migrateSettings({ a: 1 }, addMissingProperties, { b: 1 })).toStrictEqual({
        b: 1,
      })
    })
    it('incompatible types should be replaced', () => {
      expect(migrateSettings(0, addMissingProperties, 'a')).toStrictEqual('a')
      expect(migrateSettings({ a: 1 }, addMissingProperties, 'a')).toStrictEqual('a')
      expect(migrateSettings({ a: 1 }, addMissingProperties, null)).toStrictEqual(null)
      expect(migrateSettings(null, addMissingProperties, ['1'])).toStrictEqual(['1'])
    })
    it('migrate with script, simple', () => {
      const migration = Migration.script((state) => `OK,${state}`)
      expect(migrateSettings(0, migration, 'def')).toStrictEqual('OK,0')
    })
    it('migrate with script + add Missing props', () => {
      const migration = Migration.script((state) => ({
        a: `OK,${state}`,
      }))
      expect(migrateSettings(0, migration, { a: 'a', b: 'def' })).toStrictEqual({
        a: 'OK,0',
        b: 'def',
      })
    })
  })
})

const currentSettingsA = {
  a: [1, '2', { ca: 'a' }, [1, 2, 3]],
  b: [
    { da: 10, db: 11 },
    { da: 20, db: 21 },
    { da: 30, db: 31 },
  ],
}

const newDefaultSettingsA = {
  a: {
    ca: 1,
    cb: '2',
    cc: { ca: 'a' },
    cd: [1, 2, 3],
  },
  b: [
    { da: 10, db: 11, dc: 'new' },
    { da: 20, db: 21, dc: 'new' },
  ],
  c: 42,
}
const resultResetSettingsA = newDefaultSettingsA

const resultAddMissingPropertiesA = {
  a: {
    ca: 1,
    cb: '2',
    cc: { ca: 'a' },
    cd: [1, 2, 3],
  },
  b: [
    { da: 10, db: 11, dc: 'new' },
    { da: 20, db: 21, dc: 'new' },
    { da: 30, db: 31, dc: 'new' },
  ],
  c: 42,
}

const currentSettingsB = {
  a: [{ da: 10, db: 11, dc: 'old' }],
}
const newDefaultSettingsB = {
  a: [
    { da: -10, db: -11, dc: 'new' },
    { da: 20, db: 21, dc: 'new' },
  ],
}
const resultAddMissingPropertiesMoreItemsInArrayB = {
  a: [
    { da: 10, db: 11, dc: 'old' },
    { da: 20, db: 21, dc: 'new' },
  ],
}

const currentSettingsC = [
  { name: 'M1', io: 1 },
  { name: 'M2', io: 2 },
  { name: 'M3', io: 5 },
]

const newDefaultSettingsC = [{ name: 'M1', io: 1, desc: 'machine connector' }]

const resultWorkWithArraysC = [
  { name: 'M1', io: 1, desc: 'machine connector' },
  { name: 'M2', io: 2, desc: 'machine connector' },
  { name: 'M3', io: 5, desc: 'machine connector' },
]
