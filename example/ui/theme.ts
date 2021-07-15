import { createStyles, makeStyles } from '@material-ui/core'
import * as React from 'react'

export const cardStyle = (width: React.CSSProperties['width'] = 600): React.CSSProperties => ({
  borderRadius: 3,
  width,
  margin: '12px 12px',
  padding: '12px 24px',
  backgroundColor: 'white',
})

export const useStyle = makeStyles((_theme) =>
  createStyles({
    paper: {
      padding: '24px 36px',
      margin: '12px 12px',
    },
    appSelect: {
      padding: '12px 12px',
      cursor: 'pointer',
    },
    settingsPreview: {
      border: '1px solid gray',
      backgroundColor: '#ededed',
      padding: '12px 24px',
    },
    drawItem: {
      cursor: 'pointer',
      paddingLeft: 12,
    },
  }),
)
