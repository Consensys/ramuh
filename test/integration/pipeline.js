const tape = require('tape')
const { PassThrough } = require('stream')
const tmp = require('tmp')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const nock = require('nock')
const url = require('url')
const solc = require('solc')

const Pipeline = require('../../lib/pipeline')
const { getLogger } = require('../../lib/logging')

const logger = getLogger({loglevel: 'error'})
const firstContractName = 'Hello'
const secondContractName = 'GoodBye'
const firstBytecode = 'hello-bytecode'
const secondBytecode = 'goodbye-bytecode'
const apiUrl = url.parse('http://localhost:3100')
const apiKey = 'my-valid-api-key'
const basePath = '/mythril/v1/analysis'
const firstUuid = 'first-uuid'
const secondUuid = 'second-uuid'
const firstIssuesPath = `/mythril/v1/analysis/${firstUuid}/issues`
const secondIssuesPath = `/mythril/v1/analysis/${secondUuid}/issues`
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
const firstKey = ':' + firstContractName
const secondKey = ':' + secondContractName

tape('[PIPELINE]: basic functionality', t => {
  t.test('setup', st => {
    sinon.stub(solc, 'compile').returns({
      contracts: {
        [firstKey]: {
          bytecode: firstBytecode
        },
        [secondKey]: {
          bytecode: secondBytecode
        }
      }
    })

    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${apiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: firstBytecode
      })
      .reply(200, {
        result: 'Queued',
        uuid: firstUuid
      })
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${apiKey}`
      }
    })
      .post(basePath, {
        type: 'bytecode',
        contract: secondBytecode
      })
      .reply(200, {
        result: 'Queued',
        uuid: secondUuid
      })

    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${apiKey}`
      }
    })
      .get(firstIssuesPath)
      .times(3)
      .reply(400, {
        status: 400,
        error: 'Result is not Finished',
        stack: 'BadRequestError: Result is not Finished\n    at getIssues (/home/fgimenez/workspace/mythril-api/src/services/AnalysisService.js:129:11)\n    at <anonymous>'
      })
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${apiKey}`
      }
    })
      .get(firstIssuesPath)
      .reply(200, [])
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${apiKey}`
      }
    })
      .get(secondIssuesPath)
      .times(3)
      .reply(400, {
        status: 400,
        error: 'Result is not Finished',
        stack: 'BadRequestError: Result is not Finished\n    at getIssues (/home/fgimenez/workspace/mythril-api/src/services/AnalysisService.js:129:11)\n    at <anonymous>'
      })
    nock(`${apiUrl.href}`, {
      reqheaders: {
        authorization: `Bearer ${apiKey}`
      }
    })
      .get(secondIssuesPath)
      .reply(200, expectedIssues)

    st.end()
  })

  t.test('result files should be writen', st => {
    const tmpDir = tmp.dirSync().name
    const pipeline = new Pipeline(tmpDir, apiUrl, apiKey, logger)
    const origin = pipeline.run()
    const target = PassThrough({objectMode: true})

    origin.pipe(target)

    const filePath = path.resolve(tmpDir, 'test.sol')
    fs.writeFile(filePath, 'fake content', (err) => {
      st.error(err, 'writing file succeeded')
    })

    const firstResultsPath = [filePath, firstContractName, 'mythril'].join('.')
    const secondResultsPath = [filePath, secondContractName, 'mythril'].join('.')

    let first = true

    target.on('data', (data) => {
      st.equal(data.filePath, filePath)

      if (first) {
        st.equal(data.contract.name, firstContractName)
        st.equal(data.contract.bytecode, firstBytecode)
        st.equal(data.analysis.uuid, firstUuid)
        st.deepEqual(data.analysis.issues, [])
        st.equal(data.results.path, firstResultsPath)

        first = false
      } else {
        st.equal(data.contract.name, secondContractName)
        st.equal(data.contract.bytecode, secondBytecode)
        st.equal(data.analysis.uuid, secondUuid)
        st.deepEqual(data.analysis.issues, expectedIssues)
        st.equal(data.results.path, secondResultsPath)

        pipeline.stop()
        st.end()
      }
    })
  })

  t.test('teardown', st => {
    solc.compile.restore()
    st.end()
  })
})
