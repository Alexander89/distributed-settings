import { Box, Button } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import * as React from 'react'
import { AppSettings, PeerResponse } from '../../src'
import { Editor } from './Editor'
import { CommandFeedback } from './CommandFeedback'
import bEx from 'brace-expansion'
import deepEqual from 'deep-equal'
import Ajv from 'ajv'
import { ValidSettings } from './ValidSettings'

type Props = {
  appId: string
  appSettings: AppSettings<Readonly<unknown>>
  peer: string
  timeout: number
}

export const SettingsSetComplete = ({ peer, appId, appSettings, timeout }: Props): JSX.Element => {
  const [currentSettings, setCurrentSettings] = React.useState<any>()
  const [updatedSettings, setUpdatedSettings] = React.useState<any>()
  const [allSame, setAllSame] = React.useState(true)
  const [schema, setSchema] = React.useState<object | boolean>(true)
  const [schemaValid, setSchemaValid] = React.useState(false)
  const [settingsInputValid, setSettingsInputValid] = React.useState(false)
  const [openFeedback, setOpenFeedback] = React.useState<Promise<PeerResponse> | undefined>(
    undefined,
  )

  const valid = (): string => {
    if (settingsInputValid && schemaValid) {
      return 'Valid'
    } else if (!settingsInputValid) {
      return 'Format invalid'
    } else if (!schemaValid) {
      return "Doesn't match schema"
    } else {
      return 'Invalid'
    }
  }

  React.useEffect(() => {
    const valid = new Ajv().compile(schema)(updatedSettings)
    console.log('useEffect', valid, schema, updatedSettings)
    setSchemaValid(valid === true)
  }, [schema, updatedSettings])

  React.useEffect(() => {
    appSettings.getSchema().then((schema) => schema && setSchema(schema))
  }, [appId])

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
      setCurrentSettings(undefined)
    }
  }, [peer, appId])

  return (
    <Box>
      {!allSame && (
        <Alert severity="warning">
          The selected peers have different settings. This action will overwrite them complete all.
          Probably you want to use the "partial settings" method.
        </Alert>
      )}
      <Box>
        <Editor
          file={JSON.stringify(currentSettings || 'loading...', undefined, 2)}
          diff={JSON.stringify(currentSettings || 'loading...', undefined, 2)}
          style={{ height: 400, width: '100%' }}
          onChanged={(text) => {
            try {
              const settings = JSON.parse(text)
              setSettingsInputValid(true)
              setUpdatedSettings(settings)
            } catch (_) {
              setSettingsInputValid(false)
            }
          }}
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        disabled={!valid}
        onClick={() =>
          updatedSettings &&
          setOpenFeedback(appSettings.set(peer, updatedSettings, undefined, timeout))
        }
      >
        Update Settings
      </Button>
      <Box display="inline" style={{ marginLeft: 24 }}>
        <ValidSettings valid={valid()} />
      </Box>
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
