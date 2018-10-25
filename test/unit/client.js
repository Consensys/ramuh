const sinon = require('sinon')
const { PassThrough } = require('stream')
require('chai')
  .should()

const Client = require('../../lib/client')
const { getLogger } = require('../../lib/logging')

const logger = getLogger({loglevel: 'err'})
const filePath = 'test.sol'
const source = 'my source'
const bytecode = 'my-bytecode'
const deployedBytecode = 'my-deployed-byte-code'
const contractName = 'Hello'
const sourceMap = 'my-source-map'
const deployedSourceMap = 'my-deployed-source-map'
const sources = {}
sources[filePath] = source
const data = {
  contractName,
  bytecode,
  deployedBytecode,
  analysisMode: 'full',
  sources,
  sourceList: [filePath],
  sourceMap,
  deployedSourceMap
}
const expectedIssues = [
  {
    title: 'my issue',
    description: 'my issue description',
    function: '_function_0xcbf0b0c0',
    type: 'Warning',
    address: 156,
    debug: 'SOLVER OUTPUT:\ncalldata_MAIN_0: 0xcbf0b0c000000000000000000000000000000000000000000000000000000000\ncalldatasize_MAIN: 0x4\ncallvalue: 0x0\n'
  }
]

describe('client', () => {
  it('includes the results given by armlet', done => {
    const analyzer = {analyze: () => {}}
    sinon.stub(analyzer, 'analyze')
      .withArgs({data})
      .returns(new Promise((resolve, reject) => {
        resolve(expectedIssues)
      }))

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    const client = new Client({logger: logger, analyzer: analyzer})

    origin.write({
      filePath,
      contract: {
        fileName: filePath,
        name: contractName,
        bytecode,
        deployedBytecode,
        source,
        sourceMap,
        deployedSourceMap
      }
    })

    origin.pipe(client).pipe(target)

    target.on('data', data => {
      data.filePath.should.equal(filePath)
      data.contract.name.should.equal(contractName)
      data.contract.bytecode.should.equal(bytecode)
      data.analysis.issues.should.deep.equal(expectedIssues)

      done()
    })
  })
})
