import * as React from 'react'
import { AppSettings } from '../../src'
import { Box, TextField, Paper, Typography, Tabs, Tab } from '@material-ui/core'
import { useStyle } from './theme'
import bEx from 'brace-expansion'
import { SettingsSetComplete } from './SettingsSetComplete'
import { SettingsSetPartial } from './SettingsSetPartial'

type Props = {
  appId: string
  appSettings: AppSettings<Readonly<unknown>>
  timeout: number
}

type Mode = 'complete' | 'partial'

export const SettingsSet = ({ appId, appSettings, timeout }: Props) => {
  const [peer, setPeer] = React.useState<string>('')
  const [knownMatchingPeers, setKnownMatchingPeers] = React.useState<string[]>([])
  const [mode, setMode] = React.useState<Mode>('complete')

  const classes = useStyle()

  React.useEffect(() => {
    const peers = bEx(peer)
    appSettings
      .listPeers()
      .then((list) => list.filter((e) => peers.includes(e)))
      .then(setKnownMatchingPeers)
  }, [appSettings, peer, appId])

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6">Settings Set</Typography>
      <Box>
        <TextField
          label="Destination Peers"
          inputProps={{ 'aria-label': 'Destination Peers' }}
          value={peer}
          onChange={({ target }) => setPeer(target.value)}
        />
        <Box>
          <Typography>Matching known peers</Typography>
          <Typography>{knownMatchingPeers.join(', ')}</Typography>
        </Box>
      </Box>

      <Paper square>
        <Tabs
          value={mode}
          indicatorColor="primary"
          textColor="primary"
          onChange={(_, value) => {
            console.log(value)
            setMode(value as Mode)
          }}
        >
          <Tab value="complete" label="Complete Settings" />
          <Tab value="partial" label="Partial Settings" />
        </Tabs>
      </Paper>
      {mode === 'complete' && (
        <SettingsSetComplete
          appId={appId}
          peer={peer}
          appSettings={appSettings}
          timeout={timeout}
        />
      )}
      {mode === 'partial' && (
        <SettingsSetPartial appId={appId} peer={peer} appSettings={appSettings} timeout={timeout} />
      )}
    </Paper>
  )
}
