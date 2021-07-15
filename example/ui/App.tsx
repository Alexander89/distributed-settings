import * as React from 'react'
import { AppSettingsMain } from './AppSettingsMain'
import { Settings } from '../../src/impl_v1'
import { usePond } from '@actyx-contrib/react-pond'
import { Settings as SettingsType } from '../../src'
import { AppIdInput } from './AppIdInput'
import { Container, Grid } from '@material-ui/core'

export const App = () => {
  const [appId, setAppId] = React.useState('')
  const [settings, setSettings] = React.useState<SettingsType | undefined>(undefined)
  const [timeout, setTimeout] = React.useState(15000)

  const pond = usePond()
  React.useEffect(() => {
    const s = Settings(pond)
    setSettings(s)
  }, [])

  if (settings) {
    return (
      <Container>
        <Grid container spacing={3}>
          <Grid item md={4}>
            <AppIdInput
              appId={appId}
              onAppIdChanged={setAppId}
              settings={settings}
              timeout={timeout}
              onTimeoutChanged={setTimeout}
            />
          </Grid>
          <Grid item md={8}>
            {appId && <AppSettingsMain appId={appId} settings={settings} timeout={timeout} />}
          </Grid>
        </Grid>
      </Container>
    )
  } else {
    return <div>Loading...</div>
  }
}
