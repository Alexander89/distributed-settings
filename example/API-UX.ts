import { Pond } from '@actyx/pond'
import { hostname } from 'os'
import { Settings } from '../src/API_test_v2'

Pond.default({
  appId: 'com.example.settings.test',
  displayName: 'settings Test',
  version: '0.0.1',
}).then(async (pond) => {
  const settings = Settings(pond)
  const apps = await settings.listApps()

  console.log(apps)

  const appSettings = settings.app('app1')

  const peers = await appSettings.listPeers()
  const config = appSettings.get(hostname())

  console.log(
    'update one values',
    await appSettings.set('{linux*, Win*}', '192.168.199.30', '.plcIp'),
  )
  console.log(
    'update one values',
    await appSettings.set(['linux*', 'Win*'], '192.168.199.30', '.plcIp'),
  )
  console.log(
    'update 8 values',
    await appSettings.set('linux*', 'ToDo', '.errors.{1,{3..5}}.{description,details.description}'),
  )
  console.log('unset 4 values', await appSettings.unset('linux*', '.errors.{1,{3..5}}.details'))

  console.log(
    'migrate all local known peers-settings and verify if they result in valid settings to the schema',
    await appSettings.verifySettings(
      'Schema{"abc": {i : number, y: text}}',
      { abc: { i: 1, y: 2 } },
      { abc: { i: 'abc.y' } },
    ),
  )

  console.log(
    'create new version of the schema, with default for new peers and migration for existing settings',
    await appSettings.defineSettings(
      'Schema{"abc": {i : number, y: text}}',
      { abc: { i: 1, y: 2 } },
      { abc: { i: 'abc.y' } },
    ),
  )

  console.log(hostname(), peers)
  console.log(config)
})
