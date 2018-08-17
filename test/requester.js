const tape = require('tape')
const Requester = require('../lib/requester')
const PassThrough = require('stream').PassThrough
const { getLogger } = require('../lib/logging')
const logger = getLogger({loglevel: 'error'})
const apiHostname = 'localhost'
const basePath = '/mythril/v1/analysis'
const validApiKey = 'my-valid-api-key'
const filePath = 'test.sol'
const uuid = '82e368be-8fa3-469a-83d4-2fdcacb2d1dd'
const nock = require('nock')
const bytecode = 'my-byte-code'
const contractName = ':Hello'

tape('[REQUESTER]: server interaction', t => {
  t.test('should request analysis', st => {
    nock(`http://${apiHostname}:3100`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: bytecode
      })
      .reply(200, {
        result: 'Queued',
        uuid: uuid
      })

    const requester = new Requester({logger: logger, apiHostname: apiHostname, apiKey: validApiKey})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.write({
      filePath: filePath,
      contract: {
        name: contractName,
        bytecode: bytecode
      }
    })

    origin.pipe(requester).pipe(target)

    target.on('data', (data) => {
      st.equal(data.filePath, filePath)
      st.equal(data.contract.name, contractName)
      st.equal(data.contract.bytecode, bytecode)
      st.equal(data.analysis.uuid, uuid)

      st.end()
    })
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
