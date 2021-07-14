export const defaultSettingsA = {
  a: 1,
  b: { ba: 1, bb: 'hello' },
  c: [1, 2, 3],
}
export type DefaultSettingsA = typeof defaultSettingsA

export const schemaA = {
  type: 'object',
  properties: {
    a: { type: 'integer' },
    b: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ba: { type: 'integer' },
        bb: { type: 'string' },
      },
    },
    c: {
      type: 'array',
      additionalItems: false,
      items: [{ type: 'integer' }],
    },
  },
  required: ['a', 'b', 'c'],
  additionalProperties: false,
}

export const stateAfterA = {
  defined: true,
  lastUpdate: 0,
  schema: schemaA,
  setting: {
    a: 1,
    b: { ba: 1, bb: 'hello' },
    c: [1, 2, 3],
  },
  version: 1,
}

export const stateAfterB = {
  defined: true,
  lastUpdate: 0,
  schema: schemaA,
  setting: 'testOk, migration called',
  version: 2,
}
