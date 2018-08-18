const tape = require('tape')
const Requester = require('../lib/requester')
const PassThrough = require('stream').PassThrough
const { getLogger } = require('../lib/logging')
const nock = require('nock')

const logger = getLogger({loglevel: 'error'})
const apiHostname = 'localhost'
const basePath = '/mythril/v1/analysis'
const filePath = 'test.sol'
const bytecode = 'my-byte-code'
const contractName = ':Hello'

tape('[REQUESTER]: server interaction', t => {
  const validApiKey = 'my-valid-api-key'

  t.test('should request analysis', st => {
    const uuid = '82e368be-8fa3-469a-83d4-2fdcacb2d1dd'

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

  t.test('should handle server errors', st => {
    nock(`http://${apiHostname}:3100`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: bytecode
      })
      .reply(500)

    const requester = new Requester({logger: logger, apiHostname: apiHostname, apiKey: validApiKey})

    requester.on('error', (err) => {
      st.equal(err, 'received error 500 from API server')

      st.end()
    })

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
  })
})

tape('[REQUESTER]: authentication', t => {
  t.test('should handle authentication errors', st => {
    const inValidApiKey = 'my-invalid-api--key-sigh'

    nock(`http://${apiHostname}:3100`, {
      reqheaders: {
        authorization: `Bearer ${inValidApiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: bytecode
      })
      .reply(401, 'Unauthorized')

    const requester = new Requester({logger: logger, apiHostname: apiHostname, apiKey: inValidApiKey})
    requester.on('error', (err) => {
      st.equal(err, `Unauthorized analysis request, API key: ${inValidApiKey}`)

      st.end()
    })

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
  })
})
