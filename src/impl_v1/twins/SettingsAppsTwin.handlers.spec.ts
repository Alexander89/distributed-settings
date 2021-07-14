import { SettingsDefineEvent, SettingsState } from './SettingsAppsTwin'
import { handleDefineSettings } from './SettingsAppsTwin.handlers'
import {
  defaultSettingsA,
  DefaultSettingsA,
  schemaA,
  stateAfterA,
  stateAfterB,
} from './SettingsAppsTwin.handlers.test'
import { Migration } from './SettingsAppsTwin.migration'

const appId = 'testApp'

describe('SettingsAppsTwin-handlers', () => {
  describe('handleDefineSettings', () => {
    it('handleDefineSettings first Time (no migration)', () => {
      const initState: SettingsState<DefaultSettingsA> = { defined: false }
      const event = {
        eventType: 'settingsDefine',
        appId,
        defaultSettings: defaultSettingsA,
        migration: Migration.resetToDefault(),
        schema: schemaA,
      } as SettingsDefineEvent<DefaultSettingsA>

      expect(handleDefineSettings(initState, event, 0)).toStrictEqual(stateAfterA)
    })
    it('handleDefineSettings second Time check if migration is called an version bumped', () => {
      jest.mock('./SettingsAppsTwin.migration', () => ({
        migrateSettings: () => stateAfterB.setting,
      }))

      const initState: SettingsState<DefaultSettingsA | string> = stateAfterA
      const event = {
        eventType: 'settingsDefine',
        appId,
        defaultSettings: stateAfterB.setting,
        migration: Migration.resetToDefault(),
        schema: schemaA,
      } as SettingsDefineEvent<string>

      expect(handleDefineSettings(initState, event, 0)).toStrictEqual(stateAfterB)
    })
    it('handleDefineSettings validate Schema. don`t update definition', () => {
      const errorSpy = spyOn(console, 'error')
      const initState: SettingsState<DefaultSettingsA | string> = stateAfterA
      // @ts-expect-error
      const event = {
        eventType: 'settingsDefine',
        appId,
        defaultSettings: stateAfterB.setting,
        migration: Migration.resetToDefault(),
        schema: 'SomeThingWrong = boom',
      } as SettingsDefineEvent<string>

      expect(handleDefineSettings(initState, event, 0)).toStrictEqual(initState)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })
  })
})
