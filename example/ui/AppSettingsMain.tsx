import { Tab, Tabs, Paper, Box } from '@material-ui/core'
import * as React from 'react'
import { Settings } from '../../src'
import { SettingsCommander } from './SettingsCommander'
import { SettingsPreview } from './SettingsPreview'
import { SettingsSet } from './SettingsSet'

type Props = {
  appId: string
  settings: Settings
  timeout: number
}

type Modes = 'preview' | 'set' | 'define'

export const AppSettingsMain = ({ appId, settings, timeout }: Props) => {
  const [mode, setMode] = React.useState<Modes>('preview')

  return (
    <Box>
      <Paper square>
        <Tabs
          value={mode}
          indicatorColor="primary"
          textColor="primary"
          onChange={(_, value) => {
            console.log(value)
            setMode(value as Modes)
          }}
          aria-label="disabled tabs example"
        >
          <Tab value="preview" label="Inspect" />
          <Tab value="set" label="Set" />
          <Tab value="define" label="Definition" />
        </Tabs>
      </Paper>
      {mode === 'preview' && (
        <SettingsPreview appId={appId} appSettings={settings.app(appId)} timeout={timeout} />
      )}
      {mode === 'set' && (
        <SettingsSet appId={appId} appSettings={settings.app(appId)} timeout={timeout} />
      )}
      {mode === 'define' && (
        <SettingsCommander appId={appId} appSettings={settings.app(appId)} timeout={timeout} />
      )}
    </Box>
  )
}
