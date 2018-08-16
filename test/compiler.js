const tape = require('tape')
const Compiler = require('../lib/compiler')
const fs = require('fs')
const path = require('path')
const tmp = require('tmp')
const through = require('through')
const { getLogger } = require('../lib/logging')
const logger = getLogger({loglevel: 'error'})
const sinon = require('sinon')
const solc = require('solc')

tape('[COMPILER]: compile files', t => {
  t.test('should return bytecode of files with a single contract', st => {
    const tmpDir = tmp.dirSync().name
    const filePath = path.resolve(tmpDir, 'test.sol')

    const expectedBytecode = '6080604052348015600f57600080fd5b50603580601d6000396000f3006080604052600080fd00a165627a7a72305820dc80e598282646461f0b0d4e04097ad20ec3797452ca6ee933b63ad5aa24e3aa0029'
    sinon.stub(solc, 'compile').returns({
      contracts: {
        ':Hello': {
          bytecode: expectedBytecode
        }
      }
    })
    const compiler = new Compiler({logger: logger, solc: solc})

    const origin = through()
    const target = through(function write (data) {
      this.emit('data', data)
    })

    origin.pipe(compiler).pipe(target)

    const contractContent = `pragma solidity ^0.4.24;
contract Hello {}
`
    fs.writeFile(filePath, contractContent, (err) => {
      st.error(err, 'writing file succeeded')

      origin.write(filePath)
    })

    target.on('data', (data) => {
      st.equal(data.filePath, filePath)

      const expectedContract = ':Hello'
      st.equal(data.contracts[0].name, expectedContract)

      st.equal(data.contracts[0].bytecode, expectedBytecode)

      solc.compile.restore()
      st.end()
    })
  })

  t.test('should throw on invalid contracts', st => {
    const errMsg = 'An error happened'
    sinon.stub(solc, 'compile').returns({
      errors: [errMsg]
    })
    const compiler = new Compiler({logger: logger, solc: solc})

    const origin = through()
    const target = through(function write (data) {
      this.emit('data', data)
    })

    origin.pipe(compiler).pipe(target)

    const contractContent = `pragma solidity ^0.4.24;
contract Hello {}
`
    const tmpDir = tmp.dirSync().name
    const filePath = path.resolve(tmpDir, 'test.sol')
    fs.writeFile(filePath, contractContent, (err) => {
      st.error(err, 'writing file succeeded')

      origin.write(filePath)
    })

    compiler.on('error', (err) => {
      st.equal(err, errMsg)

      solc.compile.restore()
      st.end()
    })
  })
})
