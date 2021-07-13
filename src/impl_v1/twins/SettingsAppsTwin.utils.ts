export const isArray = (a: any): a is Array<unknown> => Array.isArray(a)
export const isNull = (a: any): a is null => a === null
export const isObject = (a: any): a is Record<string, unknown> =>
  typeof a === 'object' && a !== null && !Array.isArray(a)
export const isSameType = <T>(a: unknown, b: T): a is T => {
  if (isObject(b) || isObject(a)) {
    return isObject(b) && isObject(a)
  } else if (isArray(b) || isArray(a)) {
    return isArray(b) && isArray(a)
  } else {
    return typeof a === typeof b
  }
}
