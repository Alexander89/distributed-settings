import * as React from 'react'
import { AppSettings } from '../../src'
import { TextField, Paper, Typography, Box, Button, Grid } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab'
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
  }, [appId])

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6">Settings Monitor</Typography>
      <Grid container spacing={3}>
        <Grid item md={3}>
          <Autocomplete
            id="AppId-demo"
            freeSolo
            options={[...knownPeers]}
            value={peer}
            onChange={(_, value) => value && setPeer(value)}
            onInputChange={(_, value) => setPeer(value)}
            renderInput={(params) => <TextField {...params} label="Peer" margin="normal" />}
          />
        </Grid>
        <Grid item>
          <Typography>Known peers</Typography>
          <Box>
            {knownPeers.map((name) => (
              <Button color="primary" key={name} onClick={() => setPeer(name)}>
                {name}
              </Button>
            ))}
          </Box>
        </Grid>
      </Grid>

      <Box>
        <Typography>Settings</Typography>
        <Box className={classes.settingsPreview}>
          <pre>{currentSettings}</pre>
        </Box>
      </Box>
    </Paper>
  )
}
