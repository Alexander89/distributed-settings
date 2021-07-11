import { Pond } from '@actyx/pond'
import { Settings } from '.'

const delay = (t: number) => new Promise<void>((res) => setTimeout(() => res(), t))

describe('integration', () => {
  it('simple', async () => {
    const actyx = Pond.test()
    const peerName = 'testPC'
    const settingsSub = jest.fn((s) => true)

    // create settings
    const settings = Settings(actyx)
    expect(settings).toHaveProperty('listApps')
    expect(settings).toHaveProperty('app')

    // listApps
    const apps = await settings.listApps()
    expect(apps).toStrictEqual([])

    // works twice listApps
    const apps2 = await settings.listApps()
    expect(apps2).toStrictEqual([])

    // get settings interface for app1
    const appSettings = settings.app('app1')
    expect(appSettings).toHaveProperty('defineSettings')
    expect(appSettings).toHaveProperty('get')
    expect(appSettings).toHaveProperty('getSchema')
    expect(appSettings).toHaveProperty('listPeers')
    expect(appSettings).toHaveProperty('set')
    expect(appSettings).toHaveProperty('subscribe')
    expect(appSettings).toHaveProperty('unset')
    expect(appSettings).toHaveProperty('verifySettings')

    // get peerlist. should be empty
    const peers = await appSettings.listPeers()
    expect(peers).toStrictEqual([])

    // subscribe to changing on a peer
    const cancelSub = appSettings.subscribe(peerName, settingsSub)
    await delay(10)
    expect(settingsSub).toHaveBeenCalledTimes(1)
    expect(settingsSub).toHaveBeenCalledWith(undefined)

    // check if name is now available
    const peersFilled = await appSettings.listPeers()
    expect(peersFilled).toStrictEqual([peerName])

    // define settings and validate if peers applied them
    const applyDefinitionRes = await appSettings.defineSettings(
      'Schema{"abc": {i : number, y: text}}',
      { a: 0, b: 0 },
      { a: 'a', b: 'a' },
    )
    expect(applyDefinitionRes).toStrictEqual({ response: 'succeeded', updatedPeers: ['testPC'] })

    // check if update is triggered after settings got defined
    await delay(10)
    expect(settingsSub).toHaveBeenCalledTimes(2)
    expect(settingsSub).toHaveBeenCalledWith({ a: 0, b: 0 })

    // stop settings subscription
    cancelSub()
    await delay(10)

    // res when the settings are set
    const setRes = await appSettings.set('testPC', 1, 'a', 10000)
    await delay(10)
    expect(settingsSub).toHaveBeenCalledTimes(2)
    expect(setRes).toStrictEqual({ response: 'succeeded', updatedPeers: [] })
  }, 10000)
})
