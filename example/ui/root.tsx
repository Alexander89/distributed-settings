import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Pond } from '@actyx-contrib/react-pond'
import { App } from './App'

export const Root = (): JSX.Element => {
  const manifest = {
    appId: 'com.example.settings.manager',
    displayName: 'Distributed Settings Manager',
    version: '0.0.1',
  }
  const onError = (e: unknown) => {
    setTimeout(() => location.reload(), 1000)
    return (
      <div>
        <div>Is Actyx running locally</div>
        <pre>{JSON.stringify(e) !== '{}' ? JSON.stringify(e) : ''}</pre>
      </div>
    )
  }
  const loadComponent = (
    <div>
      <div>connecting to local actyx instance</div>
    </div>
  )

  return (
    <Pond manifest={manifest} onError={onError} loadComponent={loadComponent}>
      <App />
    </Pond>
  )
}

ReactDOM.render(<Root />, document.getElementById('root'))
