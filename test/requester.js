/*
const tape = require('tape')
const Requester = require('../lib/requester')
const PassThrough = require('stream').PassThrough
const { getLogger } = require('../lib/logging')
const logger = getLogger({loglevel: 'error'})
const http = require('http')
const sinon = require('sinon')
const apiaddress = 'localhost:3100'
const basepath = 'mythril/v1'
const apikey = 'my-api-key'
const filePath = 'test.sol'

tape('[REQUESTER]: server interaction', t => {
  t.test('should request analysis', st => {
    sinon.stub(http, 'request').returns({
      contracts: {
        ':Hello': {
          bytecode: expectedBytecode
        }
      }
    })

    const requester = new Client({logger: logger, apiaddress: apiaddress, apikey: apikey})

    const origin = PassThrough()
    const target = PassThrough()

    origin.write({
      filePath: filePath,
      contract: {
        name: ':Hello',
        bytecode: 'mybytecode'
      }
    })
    origin.end()

    st.end()
  })

  t.test('should poll analysis results and pipe them', st => {
    st.end()
  })

  t.test('should handle server errors', st => {
    st.end()
  })
})

tape('[REQUESTER]: authentication', t => {
  t.test('should send api key', st => {
    st.end()
  })

  t.test('should handle authentication errors', st => {
    st.end()
  })
})
*/
