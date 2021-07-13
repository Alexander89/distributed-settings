import { isArray, isNull, isObject, isSameType } from './SettingsAppsTwin.utils'

describe('SettingsAppsTwin.utils', () => {
  it('isArray', () => {
    expect(isArray([])).toBeTruthy()
    expect(isArray('')).toBeFalsy()
    expect(isArray({})).toBeFalsy()
    expect(isArray(1)).toBeFalsy()
    expect(isArray(undefined)).toBeFalsy()
    expect(isArray(null)).toBeFalsy()
  })
  it('isNull', () => {
    expect(isNull(null)).toBeTruthy()
    expect(isNull('')).toBeFalsy()
    expect(isNull({})).toBeFalsy()
    expect(isNull(1)).toBeFalsy()
    expect(isNull(undefined)).toBeFalsy()
    expect(isNull([])).toBeFalsy()
  })
  it('isObject', () => {
    expect(isObject({})).toBeTruthy()
    expect(isObject('')).toBeFalsy()
    expect(isObject(null)).toBeFalsy()
    expect(isObject(1)).toBeFalsy()
    expect(isObject(undefined)).toBeFalsy()
    expect(isObject([])).toBeFalsy()
  })
  it('isSameType', () => {
    const testData = [{}, [], '', null, 1, undefined]
    testData.forEach((v1, idx1) => {
      testData.forEach((v2, idx2) => {
        expect(isSameType(v1, v2)).toBe(idx1 === idx2)
      })
    })
  })
})
