import * as React from 'react'
import { AppSettings } from '../../src'
import { TextField, Paper, Typography, Box } from '@material-ui/core'
import { useStyle } from './theme'

type Props = {
  appId: string
  appSettings: AppSettings<Readonly<unknown>>
  timeout: number
}

export const SettingsPreview = ({ appId, appSettings }: Props) => {
  const [currentSettings, setCurrentSettings] = React.useState('')
  const [peer, setPeer] = React.useState<string>('')
  const [knownPeers, setKnownPeers] = React.useState<ReadonlyArray<string>>([])

  const classes = useStyle()

  React.useEffect(() => {
    if (peer) {
      const cancel = appSettings.subscribe(peer, (s) => {
        console.log('settings.subscribe', s)
        setCurrentSettings(s === undefined ? 'not set' : JSON.stringify(s, undefined, 2))
        return false
      })
      return () => cancel()
    } else {
      setCurrentSettings('')
      return () => undefined
    }
  }, [peer, appId])

  React.useEffect(() => {
    appSettings.listPeers().then(setKnownPeers)
  }, [])

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6">Settings Preview</Typography>
      <Box>
        <TextField
          label="Peer"
          inputProps={{ 'aria-label': 'Peer' }}
          value={peer}
          onChange={({ target }) => setPeer(target.value)}
        />
      </Box>
      <Box>
        <Typography>Known peers</Typography>
        <Box>
          {knownPeers.map((name) => (
            <Typography key={name} onClick={() => setPeer(name)}>
              {name}
            </Typography>
          ))}
        </Box>
      </Box>
      <Box>
        <Typography>Settings</Typography>
        <Box className={classes.paper}>
          <Typography component="pre">{currentSettings}</Typography>
        </Box>
      </Box>
    </Paper>
  )
}
