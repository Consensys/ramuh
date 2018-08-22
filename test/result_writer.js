const tape = require('tape')
const PassThrough = require('stream').PassThrough
const { getLogger } = require('../lib/logging')
const tmp = require('tmp')
const fs = require('fs')
const path = require('path')

const ResultWriter = require('../lib/result_writer')
const logger = getLogger({loglevel: 'error'})

tape('[RESULT_WRITER]: basic functionality', t => {
  t.test('should write result files', st => {
    const tmpDir = tmp.dirSync().name
    const contractFile = 'test.sol'
    const contractName = ':Hello'
    const expectedContractName = 'Hello'

    const resultWriter = new ResultWriter({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    const expectedIssues = [
      {
        debug: 'debug1',
        address: 'address1',
        type: 'type1',
        function: 'function1',
        description: 'description1',
        title: 'title1'
      },
      {
        debug: 'debug2',
        address: 'address2',
        type: 'type2',
        function: 'function2',
        description: 'description2',
        title: 'title2'
      }
    ]

    target.on('data', (data) => {
      const expectedFilename = [contractFile, expectedContractName, 'mythril'].join('.')
      const expectedResultsPath = path.resolve(tmpDir, expectedFilename)
      st.equal(data.results.path, expectedResultsPath)

      const contents = fs.readFileSync(expectedResultsPath)
      const contentObj = JSON.parse(contents)
      st.deepEqual(expectedIssues, contentObj)

      st.end()
    })

    origin.write({
      filePath: path.resolve(tmpDir, contractFile),
      contract: {
        name: contractName
      },
      analysis: {
        issues: expectedIssues
      }
    })

    origin.pipe(resultWriter).pipe(target)
  })

  t.test('should handle write errors', st => {
    const badDir = 'not-an-actual-dir'
    const contractName = 'test.sol'

    const resultWriter = new ResultWriter({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    const filePath = path.resolve(badDir, contractName)
    resultWriter.on('err', (err) => {
      st.ok(err.startsWith(`Could not write results file ${filePath}`))

      st.end()
    })

    origin.write({
      filePath: filePath,
      contract: {
        name: 'my-name'
      },
      analysis: {
        issues: []
      }
    })

    origin.pipe(resultWriter).pipe(target)
  })
})
