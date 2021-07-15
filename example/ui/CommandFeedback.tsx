import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
  LinearProgress,
  Typography,
  Avatar,
  createStyles,
  makeStyles,
  Theme,
  Box,
} from '@material-ui/core'
import { yellow, orange, green, blue } from '@material-ui/core/colors'
import { Check, Timer } from '@material-ui/icons'
import * as React from 'react'
import { PeerResponse } from '../../src'

type Props = {
  timeout: number
  response: Promise<PeerResponse>
  onClose: () => void
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    blue: {
      color: '#fff',
      backgroundColor: blue[500],
      display: 'inline-flex',
    },
    orange: {
      color: theme.palette.getContrastText(orange[500]),
      backgroundColor: orange[500],
      display: 'inline-flex',
    },
    yellow: {
      color: theme.palette.getContrastText(yellow[500]),
      backgroundColor: yellow[500],
      display: 'inline-flex',
    },
    green: {
      color: '#fff',
      backgroundColor: green[500],
      display: 'inline-flex',
    },
    center: {
      textAlign: 'center',
    },
  }),
)

export const CommandFeedback = ({ timeout, response, onClose }: Props) => {
  const [result, setResult] = React.useState<PeerResponse | undefined>(undefined)
  const [value, setValue] = React.useState(0)

  const classes = useStyles()

  React.useEffect(() => {
    response.then(setResult)
  }, [])

  React.useEffect(() => {
    if (result) {
      return
    }

    const steps = 25
    let counter = 0
    let inter = setInterval(() => {
      const value = (100 / steps) * counter++
      console.log(value)
      setValue(value)
      if (value === 100) {
        clearInterval(inter)
      }
    }, timeout / steps)

    return () => inter && clearInterval(inter)
  }, [timeout, result])

  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      fullScreen={fullScreen}
      open={true}
      onClose={onClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">Command Feedback</DialogTitle>
      <DialogContent>
        {result === undefined ? (
          <DialogContentText>
            <Box className={classes.center}>
              <Avatar className={classes.blue}>
                <Timer />
              </Avatar>
              <Typography gutterBottom>Monitoring peer settings version.</Typography>
            </Box>
            <LinearProgress variant="determinate" value={value} />
          </DialogContentText>
        ) : (
          <DialogContentText>
            {result.response === 'noResponse' && (
              <>
                <Box className={classes.center}>
                  <Avatar className={classes.orange}>
                    <Timer />
                  </Avatar>
                  <Typography gutterBottom>Monitoring timed out.</Typography>
                </Box>
                <Typography>
                  Peers will apply the new settings as soon as they received this settings event.
                </Typography>
              </>
            )}
            {result.response === 'partial' && (
              <>
                <Box className={classes.center}>
                  <Avatar className={classes.yellow}>
                    <Check />
                  </Avatar>
                  <Typography gutterBottom>Monitoring timed out.</Typography>
                </Box>
                <Typography>
                  Some peers will apply the new settings as soon as they are received this settings
                  event.
                </Typography>
              </>
            )}
            {result.response === 'succeeded' && (
              <>
                <Box className={classes.center}>
                  <Avatar className={classes.green}>
                    <Check />
                  </Avatar>
                  <Typography gutterBottom>Succeeded</Typography>
                </Box>
                <Typography>All peers applied the new settings.</Typography>
              </>
            )}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
