const tape = require('tape')
const fs = require('fs')
const path = require('path')
const tmp = require('tmp')
const PassThrough = require('stream').PassThrough
const sinon = require('sinon')
const solc = require('solc')

const Compiler = require('../lib/compiler')
const { getLogger } = require('../lib/logging')
const logger = getLogger({loglevel: 'err'})

const expectedBytecode = '6080604052348015600f57600080fd5b50603580601d6000396000f3006080604052600080fd00a165627a7a72305820dc80e598282646461f0b0d4e04097ad20ec3797452ca6ee933b63ad5aa24e3aa0029'

tape('[COMPILER]: compile files', t => {
  t.test('should return bytecode of files with a single contract', st => {
    const tmpDir = tmp.dirSync().name
    const filePath = path.resolve(tmpDir, 'test.sol')

    sinon.stub(solc, 'compile').returns({
      contracts: {
        ':Hello': {
          bytecode: expectedBytecode
        }
      }
    })
    const compiler = new Compiler({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.pipe(compiler).pipe(target)

    const contractContent = `pragma solidity ^0.4.24;
contract Hello {}
`
    fs.writeFile(filePath, contractContent, (err) => {
      st.error(err, 'writing file succeeded')

      origin.write({filePath: filePath})
    })

    target.on('data', (data) => {
      st.equal(data.filePath, filePath)

      st.equal(data.contract.name, ':Hello')

      st.equal(data.contract.bytecode, expectedBytecode)

      solc.compile.restore()
      st.end()
    })
  })

  t.test('should emit errors on invalid contracts', st => {
    const errMsg = 'An error happened'
    sinon.stub(solc, 'compile').returns({
      errors: [errMsg]
    })
    const compiler = new Compiler({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.pipe(compiler).pipe(target)

    const contractContent = `pragma solidity ^0.4.24;
contract Hello {}
`
    const tmpDir = tmp.dirSync().name
    const filePath = path.resolve(tmpDir, 'test.sol')
    fs.writeFile(filePath, contractContent, (err) => {
      st.error(err, 'writing file succeeded')

      origin.write({filePath: filePath})
    })

    compiler.on('err', (err) => {
      st.equal(err, errMsg)

      solc.compile.restore()
      st.end()
    })
  })

  t.test('should return bytecode of files with multiple contracts', st => {
    const tmpDir = tmp.dirSync().name
    const filePath = path.resolve(tmpDir, 'test.sol')

    sinon.stub(solc, 'compile').returns({
      contracts: {
        ':GoodBay': {
          bytecode: expectedBytecode
        },
        ':Hello': {
          bytecode: expectedBytecode
        }
      }
    })
    const compiler = new Compiler({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.pipe(compiler).pipe(target)

    const contractContent = `pragma solidity ^0.4.24;
contract GoodBay {}
contract Hello is GoodBay {}
`
    fs.writeFile(filePath, contractContent, (err) => {
      st.error(err, 'writing file succeeded')

      origin.write({filePath: filePath})
    })

    let first = true
    target.on('data', (data) => {
      st.equal(data.filePath, filePath)

      if (first) {
        st.equal(data.contract.name, ':GoodBay')
        st.equal(data.contract.bytecode, expectedBytecode)
        first = false
      } else {
        st.equal(data.contract.name, ':Hello')
        st.equal(data.contract.bytecode, expectedBytecode)

        solc.compile.restore()
        st.end()
      }
    })
  })
})
