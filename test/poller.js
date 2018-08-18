const tape = require('tape')
const Poller = require('../lib/poller')
const PassThrough = require('stream').PassThrough
const { getLogger } = require('../lib/logging')
const nock = require('nock')

const logger = getLogger({loglevel: 'error'})
const apiHostname = 'localhost'
const uuid = '82e368be-8fa3-469a-83d4-2fdcacb2d1dd'
const basePath = `/mythril/v1/analysis/${uuid}/issues`

tape('[POLLER]: server interaction', t => {
  const validApiKey = 'my-valid-api-key'

  t.test('should poll issues with empty results', st => {
    nock(`http://${apiHostname}:3100`, {
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
    nock(`http://${apiHostname}:3100`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .get(basePath)
      .reply(200, [])

    const poller = new Poller({logger: logger, apiHostname: apiHostname, apiKey: validApiKey, pollStep: 10})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    target.on('data', (data) => {
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
    /*
    nock(`http://${apiHostname}:3100`, {
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
    nock(`http://${apiHostname}:3100`, {
      reqheaders: {
        authorization: `Bearer ${validApiKey}`
      }
    })
      .get(basePath)
      .reply(200, [
        {
          title: 'Unchecked SUICIDE',
          description: 'The function `_function_0xcbf0b0c0` executes the SUICIDE instruction. The remaining Ether is sent to an address provided as a function argument.\n\nIt seems that this function can be called without restrictions.',
          function: '_function_0xcbf0b0c0',
          type: 'Warning',
          address: 156,
          debug: 'SOLVER OUTPUT:\ncalldata_MAIN_0: 0xcbf0b0c000000000000000000000000000000000000000000000000000000000\ncalldatasize_MAIN: 0x4\ncallvalue: 0x0\n'
        }
      ])
    */
    st.end()
  })
})
