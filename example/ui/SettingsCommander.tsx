import * as React from 'react'
import { AppSettings, PeerResponse } from '../../src'
import { Migration } from '../../src/impl_v1/twins/SettingsAppsTwin.migration'
import { CommandFeedback } from './CommandFeedback'
import {
  Paper,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@material-ui/core'
import { useStyle } from './theme'
import { Editor } from './Editor'

type Props = {
  appId: string
  appSettings: AppSettings<Readonly<unknown>>
  timeout: number
}
type MigrationMethods = 'reset' | 'addMissingProps' | 'script' | 'script+addMissingProps'

export const SettingsCommander = ({ appId, appSettings, timeout }: Props) => {
  const [defaultSettings, setDefaultSettings] = React.useState<Readonly<unknown>>()
  const [schema, setSchema] = React.useState<any>({})
  const [migration, setMigration] = React.useState<MigrationMethods>('reset')
  //const [migrationScript, setMigrationScript] = React.useState('(state) => state')
  const [openFeedback, setOpenFeedback] = React.useState<Promise<PeerResponse> | undefined>(
    undefined,
  )

  const classes = useStyle()

  React.useEffect(() => {
    appSettings.getSchema().then((s) => console.log('getSchema', s))
    appSettings.getDefaultSettings().then((s) => console.log('getDefaultSettings', s))
    appSettings.getSchema().then((s) => setSchema(s))
    appSettings.getDefaultSettings().then((s) => setDefaultSettings(s))
  }, [appId])

  const getMigration = () => {
    switch (migration) {
      case 'addMissingProps':
        return Migration.addMissingProperties()
      case 'script':
        return Migration.script((_a, b) => b, false)
      case 'script+addMissingProps':
        return Migration.script((_a, b) => b, true)
      case 'reset':
      default:
        return Migration.resetToDefault()
    }
  }

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6">Settings Commander</Typography>

      <Box margin={2}>
        <InputLabel id="settings-label">Default Settings</InputLabel>
        <Box>
          <Editor
            file={
              defaultSettings
                ? typeof defaultSettings === 'string'
                  ? defaultSettings
                  : JSON.stringify(defaultSettings, undefined, 2)
                : 'not Set'
            }
            height={150}
            width={650}
            onFocusLost={(text) => setDefaultSettings(JSON.parse(text))}
          />
        </Box>
      </Box>

      <Box margin={2}>
        <InputLabel id="schema-label">Schema</InputLabel>
        <Box>
          <Editor
            file={
              schema
                ? typeof schema === 'string'
                  ? schema
                  : JSON.stringify(schema, undefined, 2)
                : 'true'
            }
            height={150}
            width={650}
            onFocusLost={(text) => setSchema(JSON.parse(text))}
          />
        </Box>
      </Box>

      <Box margin={2}>
        <FormControl>
          <InputLabel id="select-migration-label">Migration</InputLabel>
          <Select
            labelId="select-migration-label"
            id="select-migration"
            value={migration}
            onChange={({ target }) => setMigration(target.value as MigrationMethods)}
          >
            <MenuItem value="reset">Reset</MenuItem>
            <MenuItem value="addMissingProps">Add new Properties</MenuItem>
            <MenuItem value="script">Migration script</MenuItem>
            <MenuItem value="script+addMissingProps">Migration + Add new Properties</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          console.log('click', schema, defaultSettings, getMigration())
          if (defaultSettings) {
            setOpenFeedback(
              appSettings.defineSettings(schema, defaultSettings, getMigration(), timeout),
            )
          }
        }}
      >
        Set
      </Button>
      {openFeedback && (
        <CommandFeedback
          onClose={() => setOpenFeedback(undefined)}
          response={openFeedback}
          timeout={timeout}
        />
      )}
    </Paper>
  )
}
