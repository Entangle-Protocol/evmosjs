import eip712Types from './createTypes'
import { createBaseTypes } from './createTypes/parsePayload'
import { MAX_DUPL_TYPEDEFS } from './createTypes/parseMessage'
import { JSONObject, payloadMsgFieldForIndex } from './common'
import TestUtils from '../tests/utils'

// TODO: Test code coverage and cover missing lines

const createEIP712Types = (msgs: JSONObject[]) => {
  const numMessages = msgs.length
  const payload: JSONObject = {}

  for (let i = 0; i < msgs.length; i++) {
    const key = payloadMsgFieldForIndex(i)
    payload[key] = msgs[i]
  }

  const messageParams = {
    payload,
    numMessages,
  }

  return eip712Types(messageParams)
}

const createMsgSend = () => {
  const { denom } = TestUtils
  const recipient = TestUtils.addr1
  const amount = TestUtils.amount1
  const type = TestUtils.typeUrl1

  return {
    type,
    value: {
      recipient,
      amount: {
        amount,
        denom,
      },
    },
  }
}

const createExpEIP712Types = (
  expTxTypes: JSONObject[],
  expMsgTypes: JSONObject,
) => {
  let expTypes = createBaseTypes() as JSONObject

  expTypes.Tx.push(...expTxTypes)
  expTypes = { ...expTypes, ...expMsgTypes }

  return expTypes
}

const compareTypesAgainstExpected = (
  types: JSONObject,
  expTxTypes: JSONObject[],
  expMsgTypes: JSONObject,
) => {
  const expTypes = createExpEIP712Types(expTxTypes, expMsgTypes)

  expect(types).toStrictEqual(expTypes)
}

const expectCreateTypesToThrow = (msgs: JSONObject[]) => {
  expect(() => createEIP712Types(msgs)).toThrow(Error)
}

describe('test eip-712 type generation from payload', () => {
  it('generates types for a single-message payload', () => {
    const msgs = [createMsgSend()]
    const types = createEIP712Types(msgs)

    console.log(types)

    const expTxTypes = [
      {
        name: 'msg0',
        type: 'TypeMsgSend0',
      },
    ]

    const expMsgTypes = {
      TypeMsgSend0: [
        {
          type: 'string',
          name: 'type',
        },
        {
          type: 'TypeValue0',
          name: 'value',
        },
      ],
      TypeValue0: [
        {
          type: 'TypeValueAmount0',
          name: 'amount',
        },
        {
          type: 'string',
          name: 'recipient',
        },
      ],
      TypeValueAmount0: [
        {
          type: 'string',
          name: 'amount',
        },
        {
          type: 'string',
          name: 'denom',
        },
      ],
    }

    compareTypesAgainstExpected(types, expTxTypes, expMsgTypes)
  })

  it('handles identical duplicate types', () => {
    const msgSendJSON = createMsgSend()
    const types = createEIP712Types([msgSendJSON, msgSendJSON])

    const expTxTypes = [
      {
        name: 'msg0',
        type: 'TypeMsgSend0',
      },
      {
        name: 'msg1',
        type: 'TypeMsgSend0',
      },
    ]

    const expMsgTypes = {
      TypeMsgSend0: [
        {
          type: 'string',
          name: 'type',
        },
        {
          type: 'TypeValue0',
          name: 'value',
        },
      ],
      TypeValue0: [
        {
          type: 'TypeValueAmount0',
          name: 'amount',
        },
        {
          type: 'string',
          name: 'recipient',
        },
      ],
      TypeValueAmount0: [
        {
          type: 'string',
          name: 'amount',
        },
        {
          type: 'string',
          name: 'denom',
        },
      ],
    }

    compareTypesAgainstExpected(types, expTxTypes, expMsgTypes)
  })

  it('handles non-identical duplicate types', () => {
    const msgJSON = createMsgSend()

    // Change amount to be a numeric type instead of a string.
    const modifiedMsgJSON = JSON.parse(JSON.stringify(msgJSON))
    modifiedMsgJSON.value.amount.amount = 100

    const types = createEIP712Types([msgJSON, modifiedMsgJSON])

    const expTxTypes = [
      {
        name: 'msg0',
        type: 'TypeMsgSend0',
      },
      {
        name: 'msg1',
        type: 'TypeMsgSend1',
      },
    ]

    const expMsgTypes = {
      TypeMsgSend0: [
        {
          type: 'string',
          name: 'type',
        },
        {
          type: 'TypeValue0',
          name: 'value',
        },
      ],
      TypeValue0: [
        {
          type: 'TypeValueAmount0',
          name: 'amount',
        },
        {
          type: 'string',
          name: 'recipient',
        },
      ],
      TypeValueAmount0: [
        {
          type: 'string',
          name: 'amount',
        },
        {
          type: 'string',
          name: 'denom',
        },
      ],
      TypeMsgSend1: [
        {
          type: 'string',
          name: 'type',
        },
        {
          type: 'TypeValue1',
          name: 'value',
        },
      ],
      TypeValue1: [
        {
          type: 'TypeValueAmount1',
          name: 'amount',
        },
        {
          type: 'string',
          name: 'recipient',
        },
      ],
      TypeValueAmount1: [
        {
          type: 'int64',
          name: 'amount',
        },
        {
          type: 'string',
          name: 'denom',
        },
      ],
    }

    compareTypesAgainstExpected(types, expTxTypes, expMsgTypes)
  })

  it('handles all eip-712 variable types', () => {
    const msgJSON = {
      type: 'TestMsg',
      value: {
        int64Array: [0],
        emptyArray: [],
        number: 0,
        boolean: false,
        object: {
          string: '',
        },
      },
    }

    const types = createEIP712Types([msgJSON])

    const expTxTypes = [
      {
        name: 'msg0',
        type: 'TypeTestMsg0',
      },
    ]

    const expMsgTypes = {
      TypeTestMsg0: [
        {
          type: 'string',
          name: 'type',
        },
        {
          type: 'TypeValue0',
          name: 'value',
        },
      ],
      TypeValue0: [
        {
          type: 'bool',
          name: 'boolean',
        },
        {
          type: 'string[]',
          name: 'emptyArray',
        },
        {
          type: 'int64[]',
          name: 'int64Array',
        },
        {
          type: 'int64',
          name: 'number',
        },
        {
          type: 'TypeValueObject0',
          name: 'object',
        },
      ],
      TypeValueObject0: [
        {
          type: 'string',
          name: 'string',
        },
      ],
    }

    compareTypesAgainstExpected(types, expTxTypes, expMsgTypes)
  })
})

describe('test eip-712 types error handling', () => {
  it('errors on malformed payload', () => {
    const emptyPayload = {}
    expectCreateTypesToThrow([emptyPayload])

    const payloadMissingMsgs = {
      key: 'value',
    }
    expectCreateTypesToThrow([payloadMissingMsgs])

    const payloadMsgMissingType = {
      msgs: {
        key: 'value',
      },
    }
    expectCreateTypesToThrow([payloadMsgMissingType])
  })

  it('errors on reaching the max number of duplicates', () => {
    const msgSendJSON = createMsgSend()
    const msgJSONs: JSONObject[] = Array(MAX_DUPL_TYPEDEFS)

    for (let i = 0; i < MAX_DUPL_TYPEDEFS + 1; i++) {
      const uniqueJSON = JSON.parse(JSON.stringify(msgSendJSON))
      uniqueJSON[`${i}`] = ''

      msgJSONs[i] = uniqueJSON
    }

    expectCreateTypesToThrow(msgJSONs)
  })

  it('errors on multi-dimensional arrays', () => {
    const msgJSON = createMsgSend() as JSONObject
    msgJSON['2DArray'] = [[0]]

    expectCreateTypesToThrow([msgJSON])
  })
})
