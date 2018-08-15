const tape = require('tape')
const Compiler = require('../lib/compiler')
const fs = require('fs')
const path = require('path')
const tmp = require('tmp')
const through = require('through')
const { getLogger } = require('../lib/logging')
const logger = getLogger({loglevel: 'error'})

tape('[COMPILER]: compile files', t => {
  t.test('should return bytecode of files with a single contract', st => {
    const compiler = new Compiler({logger: logger})

    const origin = through()
    const target = through(function write (data) {
      this.emit('data', data)
    })

    origin.pipe(compiler).pipe(target)

    const tmpDir = tmp.dirSync().name
    const filePath = path.resolve(tmpDir, 'test.sol')
    const contractContent = `pragma solidity ^0.4.24;
contract Hello {}
`
    fs.writeFile(filePath, contractContent, function (err) {
      st.error(err, 'writing file succeeded')

      origin.write(filePath)
    })

    target.on('data', function (data) {
      const actual = data.toString('utf8')
      const expected = '6080604052348015600f57600080fd5b50603580601d6000396000f3006080604052600080fd00a165627a7a72305820dc80e598282646461f0b0d4e04097ad20ec3797452ca6ee933b63ad5aa24e3aa0029'
      st.equal(actual, expected)
      st.end()
    })
  })
})
