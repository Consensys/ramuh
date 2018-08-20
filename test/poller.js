const tape = require('tape')
const Poller = require('../lib/poller')
const PassThrough = require('stream').PassThrough
const { getLogger } = require('../lib/logging')
const nock = require('nock')
const url = require('url')

const logger = getLogger({loglevel: 'err'})
const apiUrl = url.parse('http://localhost:3108')
const uuid = '82e368be-8fa3-469a-83d4-2fdcacb2d1dd'
const basePath = `/mythril/v1/analysis/${uuid}/issues`
const validApiKey = 'my-valid-api-key'

tape('[POLLER]: server interaction', t => {
  t.test('should poll issues with empty results', st => {
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .get(basePath)
      .times(3)
      .reply(400, {
        status: 400,
        error: 'Result is not Finished',
        stack: 'BadRequestError: Result is not Finished\n    at getIssues (/home/fgimenez/workspace/mythril-api/src/services/AnalysisService.js:129:11)\n    at <anonymous>'
      })
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .get(basePath)
      .reply(200, [])

    const poller = new Poller({logger: logger, apiUrl: apiUrl, apiKey: validApiKey, pollStep: 10})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    target.on('data', (data) => {
      st.equal(data.analysis.uuid, uuid)
      st.deepEqual(data.analysis.issues, [])

      st.end()
    })

    origin.write({
      analysis: {
        uuid: uuid
      }
    })

    origin.pipe(poller).pipe(target)
  })
  t.test('should poll issues with non empty results', st => {
    const expectedIssues = [
      {
        title: 'Unchecked SUICIDE',
        description: 'The function `_function_0xcbf0b0c0` executes the SUICIDE instruction. The remaining Ether is sent to an address provided as a function argument.\n\nIt seems that this function can be called without restrictions.',
        function: '_function_0xcbf0b0c0',
        type: 'Warning',
        address: 156,
        debug: 'SOLVER OUTPUT:\ncalldata_MAIN_0: 0xcbf0b0c000000000000000000000000000000000000000000000000000000000\ncalldatasize_MAIN: 0x4\ncallvalue: 0x0\n'
      }
    ]

    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .get(basePath)
      .times(3)
      .reply(400, {
        status: 400,
        error: 'Result is not Finished',
        stack: 'BadRequestError: Result is not Finished\n    at getIssues (/home/fgimenez/workspace/mythril-api/src/services/AnalysisService.js:129:11)\n    at <anonymous>'
      })
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .get(basePath)
      .reply(200, expectedIssues)

    const poller = new Poller({logger: logger, apiUrl: apiUrl, apiKey: validApiKey, pollStep: 10})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    target.on('data', (data) => {
      st.equal(data.analysis.uuid, uuid)
      st.deepEqual(data.analysis.issues, expectedIssues)

      st.end()
    })

    origin.write({
      analysis: {
        uuid: uuid
      }
    })

    origin.pipe(poller).pipe(target)
  })
})

tape('[POLLER]: error handling', t => {
  t.test('should emit error on server 500', st => {
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .get(basePath)
      .reply(500)

    const poller = new Poller({logger: logger, apiUrl: apiUrl, apiKey: validApiKey, pollStep: 10})

    poller.on('err', (err) => {
      st.equal(err, 'received error 500 from API server')

      st.end()
    })

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.write({
      analysis: {
        uuid: uuid
      }
    })

    origin.pipe(poller).pipe(target)
  })

  t.test('should emit error on authnetication error', st => {
    const inValidApiKey = 'invalid-api-key'

    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${inValidApiKey}`
      }
    })
      .get(basePath)
      .reply(401, 'Unauthorized')

    const poller = new Poller({logger: logger, apiUrl: apiUrl, apiKey: inValidApiKey, pollStep: 10})

    poller.on('err', (err) => {
      st.equal(err, `Unauthorized analysis request, API key: ${inValidApiKey}`)

      st.end()
    })

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.write({
      analysis: {
        uuid: uuid
      }
    })

    origin.pipe(poller).pipe(target)
  })
})
