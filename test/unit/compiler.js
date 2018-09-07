const fs = require('fs')
const path = require('path')
const tmp = require('tmp')
const { PassThrough } = require('stream')
const sinon = require('sinon')
const solc = require('solc')
const should = require('chai').should()

const Compiler = require('../../lib/compiler')
const { getLogger } = require('../../lib/logging')

const logger = getLogger({loglevel: 'err'})
const helloBytecode = 'hello-bytecode'
const goodbyeBytecode = 'goodbye-bytecode'

describe('compiler', () => {
  afterEach(() => {
    solc.compileStandardWrapper.restore()
  })

  it('should return bytecode of files with a single contract', done => {
    const tmpDir = tmp.dirSync().name
    const fileName = 'test.sol'
    const filePath = path.resolve(tmpDir, fileName)
    const contractContent = `pragma solidity ^0.4.24;
contract Hello {}
`
    sinon.stub(solc, 'compileStandardWrapper')
      .withArgs(JSON.stringify({
        language: 'Solidity',
        sources: {
          [fileName]: {
            content: contractContent
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': [ 'evm.deployedBytecode' ]
            }
          }
        }
      }))
      .returns(JSON.stringify({
        contracts: {
          [fileName]: {
            'Hello': {
              evm: {
                deployedBytecode: {
                  object: helloBytecode
                }
              }
            }
          }
        }
      }))
    const compiler = new Compiler({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.pipe(compiler).pipe(target)

    fs.writeFile(filePath, contractContent, err => {
      should.not.exist(err)

      origin.write({filePath: filePath})
    })

    target.on('data', data => {
      data.filePath.should.be.equal(filePath)

      data.contract.name.should.be.equal('Hello')

      data.contract.bytecode.should.be.equal(helloBytecode)

      done()
    })
  })

  it('should emit errors on invalid contracts', done => {
    const errMsg = 'An error happened'
    sinon.stub(solc, 'compileStandardWrapper').returns(JSON.stringify({
      errors: [errMsg]
    }))
    const compiler = new Compiler({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.pipe(compiler).pipe(target)

    const contractContent = `pragma solidity ^0.4.24;
contract Hello {}
`
    const tmpDir = tmp.dirSync().name
    const filePath = path.resolve(tmpDir, 'test.sol')
    fs.writeFile(filePath, contractContent, err => {
      should.not.exist(err)

      origin.write({filePath: filePath})
    })

    compiler.on('err', err => {
      err.should.be.equal(errMsg)

      done()
    })
  })

  it('should return bytecode of files with multiple contracts', done => {
    const tmpDir = tmp.dirSync().name
    const fileName = 'test.sol'
    const filePath = path.resolve(tmpDir, fileName)

    sinon.stub(solc, 'compileStandardWrapper').returns(JSON.stringify({
      contracts: {
        [fileName]: {
          'GoodBye': {
            evm: {
              deployedBytecode: {
                object: goodbyeBytecode
              }
            }
          },
          'Hello': {
            evm: {
              deployedBytecode: {
                object: helloBytecode
              }
            }
          }
        }
      }
    }))
    const compiler = new Compiler({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.pipe(compiler).pipe(target)

    const contractContent = `pragma solidity ^0.4.24;
contract GoodBye {}
contract Hello is GoodBye {}
`
    fs.writeFile(filePath, contractContent, err => {
      should.not.exist(err)

      origin.write({filePath: filePath})
    })

    let first = true
    target.on('data', data => {
      data.filePath.should.be.equal(filePath)

      if (first) {
        data.contract.name.should.be.equal('GoodBye')
        data.contract.bytecode.should.be.equal(goodbyeBytecode)
        first = false
      } else {
        data.contract.name.should.be.equal('Hello')
        data.contract.bytecode.should.be.equal(helloBytecode)

        done()
      }
    })
  })
})
