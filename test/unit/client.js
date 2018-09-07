const sinon = require('sinon')
const { PassThrough } = require('stream')
require('chai')
  .should()

const Client = require('../../lib/client')
const { getLogger } = require('../../lib/logging')

const logger = getLogger({loglevel: 'err'})
const filePath = 'test.sol'
const bytecode = 'my-byte-code'
const contractName = 'Hello'
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
      .withArgs({bytecode: bytecode})
      .returns(new Promise((resolve, reject) => {
        resolve(expectedIssues)
      }))

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    const client = new Client({logger: logger, analyzer: analyzer})

    origin.write({
      filePath: filePath,
      contract: {
        name: contractName,
        bytecode: bytecode
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
