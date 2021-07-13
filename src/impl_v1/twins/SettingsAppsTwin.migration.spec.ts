import { Migration, migrateSettings } from './SettingsAppsTwin.migration'

describe('SettingsAppsTwin.migration', () => {
  describe('migrateSettings', () => {
    it('reset to default migration', () => {
      expect(
        migrateSettings(currentSettingsA, Migration.resetToDefault(), newDefaultSettingsA),
      ).toStrictEqual(resultResetSettingsA)
    })
    it('add missing properties migration', () => {
      expect(
        migrateSettings(currentSettingsA, Migration.addMissingProperties(), newDefaultSettingsA),
      ).toStrictEqual(resultAddMissingPropertiesA)
    })
    it('add more items to an array', () => {
      expect(
        migrateSettings(currentSettingsB, Migration.addMissingProperties(), newDefaultSettingsB),
      ).toStrictEqual(resultAddMissingPropertiesMoreItemsInArrayB)
    })
    it('array as setting', () => {
      expect(
        migrateSettings(currentSettingsC, Migration.addMissingProperties(), newDefaultSettingsC),
      ).toStrictEqual(resultWorkWithArraysC)
    })
    it('incompatible types should be replaced', () => {
      expect(migrateSettings(0, Migration.addMissingProperties(), 'a')).toStrictEqual('a')
      expect(migrateSettings({ a: 1 }, Migration.addMissingProperties(), 'a')).toStrictEqual('a')
      expect(migrateSettings({ a: 1 }, Migration.addMissingProperties(), { b: 1 })).toStrictEqual({
        b: 1,
      })
    })
    it('incompatible types should be replaced', () => {
      expect(migrateSettings(0, Migration.addMissingProperties(), 'a')).toStrictEqual('a')
      expect(migrateSettings({ a: 1 }, Migration.addMissingProperties(), 'a')).toStrictEqual('a')
      expect(migrateSettings({ a: 1 }, Migration.addMissingProperties(), null)).toStrictEqual(null)
      expect(migrateSettings(null, Migration.addMissingProperties(), ['1'])).toStrictEqual(['1'])
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
