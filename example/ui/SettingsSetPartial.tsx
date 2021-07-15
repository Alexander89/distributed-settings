import * as React from 'react'
import { AppSettings, PeerResponse } from '../../src'
import { Box, Button, Grid, TextField, Typography } from '@material-ui/core'
import { CommandFeedback } from './CommandFeedback'
import { DataType, ScopeSelector } from './ScopeSelector'
import { Autocomplete } from '@material-ui/lab'

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
    if (peer) {
      const cancel = appSettings.subscribe(peer, (s) => {
        console.log('settings.subscribe', s)
        setCurrentSettings(s === undefined ? 'not set' : s)
        return false
      })
      return () => cancel()
    } else {
      setCurrentSettings('')
      return () => undefined
    }
  }, [peer, appId])

  return (
    <Box>
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
