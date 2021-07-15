import { Pond } from '@actyx/pond'
import { hostname } from 'os'
import { Settings } from '../src/impl_v1'

const delay = (timeout: number) => new Promise<void>((res) => setTimeout(res, timeout))

type AppSettings = {
  interval: number
  delay: number
  name: string
  param: {
    name: string
    address: string
  }[]
}

//@ts-ignore
const defaultSettings = {
  interval: 1000,
  delay: 3500,
  name: 'testname',
  param: [
    {
      name: 'state',
      address: 'BD1',
    },
    {
      name: 'counter',
      address: 'BD2',
    },
  ],
}

//@ts-ignore
const schema = {
  type: 'object',
  properties: {
    interval: { type: 'integer' },
    delay: { type: 'integer' },
    name: { type: 'string' },
    param: {
      type: 'array',
      item: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
}

Pond.default({
  appId: 'com.example.settings.client.test',
  displayName: 'settings Test',
  version: '0.0.1',
}).then(async (pond) => {
  console.log('----------    connector started     ------------------')
  const appSettings = Settings(pond).app<AppSettings>('TestClient')

  appSettings.subscribe(hostname(), async (s) => {
    console.log('new settings', s)
    if (s) {
      await delay(s.delay)
      return true
    } else {
      console.log("don't start app, It is not configured")
      return false
    }
  })
})
