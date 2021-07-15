import * as React from 'react'
import { Chip } from '@material-ui/core'
import { green, red } from '@material-ui/core/colors'
import { Check, Cancel } from '@material-ui/icons'

type Props = {
  valid: string
}

export const ValidSettings = ({ valid }: Props): JSX.Element => {
  return valid.toLowerCase() === 'valid' ? (
    <Chip icon={<Check />} style={{ backgroundColor: green[500], color: 'white' }} label="valid" />
  ) : (
    <Chip icon={<Cancel />} style={{ backgroundColor: red[500], color: 'white' }} label={valid} />
  )
}
