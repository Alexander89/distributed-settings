import * as React from 'react'
import { AppSettings, PeerResponse } from '../../src'
import { Box, Button, Grid, TextField, Typography } from '@material-ui/core'
import { CommandFeedback } from './CommandFeedback'
import { DataType, ScopeSelector } from './ScopeSelector'
import { Autocomplete, Alert } from '@material-ui/lab'
import bEx from 'brace-expansion'
import deepEqual from 'deep-equal'

type Props = {
  appId: string
  appSettings: AppSettings<Readonly<unknown>>
  peer: string
  timeout: number
}

export const SettingsSetPartial = ({ appId, timeout, appSettings, peer }: Props): JSX.Element => {
  const [scope, setScope] = React.useState('')
  const [value, setValue] = React.useState<any>(undefined)
  const [currentSettings, setCurrentSettings] = React.useState<any>()
  const [dataType, setDataType] = React.useState<DataType>('JSON')
  const [allSame, setAllSame] = React.useState(true)
  const [openFeedback, setOpenFeedback] = React.useState<Promise<PeerResponse> | undefined>(
    undefined,
  )

  const setValueWithCorrectType = (value: any, dataType: DataType) => {
    switch (dataType) {
      case 'number':
        setValue(+value)
        break
      case 'string':
        setValue(value)
        break
      case 'boolean':
        setValue(value.toLowercase() === 'true')
        break
      case 'JSON':
      default:
        try {
          setValue(JSON.parse(value))
        } catch (_) {
          setValue(value)
        }
        break
    }
  }

  React.useEffect(() => {
    const peers = bEx(peer)

    if (peers.length > 1) {
      Promise.all(peers.map((p) => appSettings.get(p, true))).then((settings) => {
        setAllSame(settings.every((s) => deepEqual(s, settings[0])))
        setCurrentSettings(settings[0])
      })
    } else if (peers.length === 1) {
      appSettings.get(peers[0], true).then((setting) => {
        setAllSame(true)
        setCurrentSettings(setting)
      })
    } else {
      setCurrentSettings('')
    }
  }, [peer, appId])

  return (
    <Box>
      {!allSame && (
        <Alert severity="info">
          The selected peers have different settings. You only see the settings of the first
          matching peer in the preview.
        </Alert>
      )}
      <Grid container>
        <Grid item md={6}>
          <Typography>Settings</Typography>
          <ScopeSelector
            value={currentSettings}
            onScopeSelected={(scope, dataType) => {
              setScope(scope)
              setDataType(dataType)
            }}
          />
        </Grid>
        <Grid item md={6}>
          <Typography>Edit</Typography>
          <TextField
            label="scope"
            value={scope}
            onChange={({ target }) => setScope(target.value)}
          />
          <TextField
            label="value"
            multiline
            value={typeof value === 'object' ? JSON.stringify(value, undefined, 2) : value}
            type={dataType}
            onChange={({ target }) => setValueWithCorrectType(target.value, dataType)}
          />
          <Autocomplete
            options={['number', 'boolean', 'string', 'JSON']}
            value={dataType}
            onChange={(_, value) => setDataType(value as DataType)}
            renderInput={(params) => <TextField {...params} label="DataType" margin="normal" />}
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        color="primary"
        onClick={() =>
          scope && value && setOpenFeedback(appSettings.set(peer, value, scope, timeout))
        }
      >
        Update Settings
      </Button>
      {openFeedback && (
        <CommandFeedback
          onClose={() => setOpenFeedback(undefined)}
          response={openFeedback}
          timeout={timeout}
        />
      )}
    </Box>
  )
}
