import { Box } from '@material-ui/core'
import * as React from 'react'
import { useStyle } from './theme'

export type DataType = 'number' | 'boolean' | 'string' | 'JSON'

type DrawItemProps = {
  name: string
  value: unknown
  scope: string
  onSelected: (scope: string, dataType: DataType) => void
}

const getDataTypeOf = (value: unknown): DataType => {
  switch (typeof value) {
    case 'bigint':
    case 'number':
      return 'number'
    case 'string':
      return 'string'
    case 'boolean':
      return 'boolean'

    default:
      return 'JSON'
  }
}

const DrawItem = ({ name, value, scope, onSelected }: DrawItemProps): JSX.Element => {
  const handleOnClick = React.useCallback(
    (scope: string, value: unknown) => (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      onSelected(scope, getDataTypeOf(value))
      e.stopPropagation()
    },
    [],
  )
  const classes = useStyle()
  switch (typeof value) {
    case 'object': {
      if (Array.isArray(value)) {
        return (
          <Box onClick={handleOnClick(scope, value)} className={classes.drawItem}>
            {name}:{'['}
            {value.map((v, idx) => (
              <DrawItem
                name={`${idx}`}
                value={v}
                onSelected={onSelected}
                scope={`${scope}[${idx}]`}
              />
            ))}
            {']'}
          </Box>
        )
      } else if (value) {
        return (
          <Box onClick={handleOnClick(scope, value)} className={classes.drawItem}>
            {name}: {'{'}
            {Object.entries(value).map(([prop, v]) => (
              <DrawItem name={prop} value={v} onSelected={onSelected} scope={`${scope}.${prop}`} />
            ))}
            {'}'}
          </Box>
        )
      } else {
        return <>null</>
      }
    }
    default:
      console.log(typeof value, name, value, scope)
      return (
        <Box onClick={handleOnClick(scope, value)} className={classes.drawItem}>
          {name}: {JSON.stringify(value)}
        </Box>
      )
  }
}

type Props = {
  value: unknown
  onScopeSelected: (scope: string, dataType: DataType) => void
}

export const ScopeSelector = ({ value, onScopeSelected }: Props): JSX.Element => {
  return <DrawItem name="" value={value} onSelected={onScopeSelected} scope="" />
}
