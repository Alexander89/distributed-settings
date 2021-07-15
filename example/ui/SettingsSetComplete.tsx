import { Box, Button } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import * as React from 'react'
import { AppSettings, PeerResponse } from '../../src'
import { Editor } from './Editor'
import { CommandFeedback } from './CommandFeedback'
import bEx from 'brace-expansion'
import deepEqual from 'deep-equal'

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
  const [openFeedback, setOpenFeedback] = React.useState<Promise<PeerResponse> | undefined>(
    undefined,
  )

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
          height={400}
          width="100%"
          onFocusLost={(settings) => setUpdatedSettings(JSON.parse(settings))}
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={() =>
          updatedSettings &&
          setOpenFeedback(appSettings.set(peer, updatedSettings, undefined, timeout))
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
