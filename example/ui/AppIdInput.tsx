import * as React from 'react'
import { Settings } from '../../src'
import { Paper, Typography, Box, TextField, Button } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab'
import { useStyle } from './theme'

type Props = {
  appId: string
  settings: Settings
  onAppIdChanged: (id: string) => void
  timeout: number
  onTimeoutChanged: (timeout: number) => void
}

export const AppIdInput = ({
  appId,
  settings,
  onAppIdChanged,
  timeout,
  onTimeoutChanged,
}: Props): JSX.Element => {
  const [knownApps, setKnownApps] = React.useState<readonly string[]>([])

  React.useEffect(() => {
    const knownPeers = setInterval(() => settings.listApps().then(setKnownApps), 1000)
    return () => clearInterval(knownPeers)
  }, [])

  const classes = useStyle()

  return (
    <Box>
      <Paper className={classes.paper}>
        <Typography variant="h6">Enter your AppId</Typography>
        <Autocomplete
          id="AppId-demo"
          freeSolo
          options={[...knownApps]}
          value={appId}
          onInputChange={(_, value) => onAppIdChanged(value)}
          renderInput={(params) => <TextField {...params} label="AppId" margin="normal" />}
        />
      </Paper>
      <Paper className={classes.paper}>
        <Typography variant="h6">Known app ids:</Typography>
        {knownApps.map((app) => (
          <Button color="primary" key={app} onClick={() => onAppIdChanged(app)}>
            {app}
          </Button>
        ))}
      </Paper>
      <Paper className={classes.paper}>
        <TextField
          label="Request Timeout"
          margin="normal"
          value={timeout}
          onChange={({ target }) => onTimeoutChanged(+target.value)}
        />
      </Paper>
    </Box>
  )
}
