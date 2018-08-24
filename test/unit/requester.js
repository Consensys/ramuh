const tape = require('tape')
const { PassThrough } = require('stream')
const nock = require('nock')
const url = require('url')

const Requester = require('../../lib/requester')
const { getLogger } = require('../../lib/logging')

const logger = getLogger({loglevel: 'error'})
const apiUrl = url.parse('http://localhost:3100')
const basePath = '/mythril/v1/analysis'
const filePath = 'test.sol'
const bytecode = 'my-byte-code'
const contractName = 'Hello'
const validApiKey = 'my-valid-api-key'

tape('[REQUESTER]: server interaction', t => {
  t.test('should request analysis for http api', st => {
    const uuid = '82e368be-8fa3-469a-83d4-2fdcacb2d1dd'

    nock(`${apiUrl.href}`, {
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

    const requester = new Requester({logger: logger, apiUrl: apiUrl, apiKey: validApiKey})

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

  t.test('should request analysis for https api', st => {
    const httpsApiUrl = url.parse('https://localhost:3100')
    const uuid = '82e368be-8fa3-469a-83d4-2fdcacb2d1dd'

    nock(`${httpsApiUrl.href}`, {
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

    const requester = new Requester({logger: logger, apiUrl: httpsApiUrl, apiKey: validApiKey})

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

  t.test('should request analysis for consecutive contracts', st => {
    const uuid1 = '82e368be-8fa3-469a-83d4-2fdcacb2d1dd'
    const uuid2 = '55e368be-8fa3-469a-83d4-2fdcacb2d1ee'
    const bytecode2 = 'my-bytecode-2'
    const contractName2 = 'GoodBye'

    nock(`${apiUrl.href}`, {
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
        uuid: uuid1
      })
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: bytecode2
      })
      .reply(200, {
        result: 'Queued',
        uuid: uuid2
      })

    const requester = new Requester({logger: logger, apiUrl: apiUrl, apiKey: validApiKey})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.pipe(requester).pipe(target)

    origin.write({
      filePath: filePath,
      contract: {
        name: contractName,
        bytecode: bytecode
      }
    })
    origin.write({
      filePath: filePath,
      contract: {
        name: contractName2,
        bytecode: bytecode2
      }
    })

    let first = true
    target.on('data', (data) => {
      st.equal(data.filePath, filePath)

      if (first) {
        st.equal(data.contract.name, contractName)
        st.equal(data.contract.bytecode, bytecode)
        st.equal(data.analysis.uuid, uuid1)
        first = false
      } else {
        st.equal(data.contract.name, contractName2)
        st.equal(data.contract.bytecode, bytecode2)
        st.equal(data.analysis.uuid, uuid2)

        st.end()
      }
    })
  })
})

tape('[REQUESTER]: error handling', t => {
  t.test('should handle server errors', st => {
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: bytecode
      })
      .reply(500)

    const requester = new Requester({logger: logger, apiUrl: apiUrl, apiKey: validApiKey})

    requester.on('err', (err) => {
      st.equal(err, 'Failed to get response, status code 500: received error from API server')

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

  t.test('should handle connection errors', st => {
    const invalidApiHostname = 'http://hostname'
    const requester = new Requester({logger: logger, apiUrl: url.parse(invalidApiHostname), apiKey: validApiKey})

    requester.on('err', (err) => {
      st.equal(err, `Could not connect to API server at ${invalidApiHostname}/`)

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

  t.test('should handle request limit errors', st => {
    const expectedErrorMsg = 'request limit exceeded'
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: bytecode
      })
      .reply(429, {
        error: expectedErrorMsg
      })

    const requester = new Requester({logger: logger, apiUrl: apiUrl, apiKey: validApiKey})

    requester.on('err', (err) => {
      st.equal(err, `Failed to get response, status code 429: ${expectedErrorMsg}`)

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
  t.test('should handle validation errors', st => {
    const expectedErrorMsg = 'validation failed'
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: bytecode
      })
      .reply(400, {
        error: expectedErrorMsg
      })

    const requester = new Requester({logger: logger, apiUrl: apiUrl, apiKey: validApiKey})

    requester.on('err', (err) => {
      st.equal(err, `Failed to get response, status code 400: ${expectedErrorMsg}`)

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

    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${inValidApiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: bytecode
      })
      .reply(401, 'Unauthorized')

    const requester = new Requester({logger: logger, apiUrl: apiUrl, apiKey: inValidApiKey})
    requester.on('err', (err) => {
      st.equal(err, `Failed to get response, status code 401: unauthorized analysis request, API key: ${inValidApiKey}`)

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
