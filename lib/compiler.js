const { Transform } = require('stream')
const fs = require('fs')
const solc = require('solc')
const path = require('path')

class Compiler extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger
  }

  _transform (obj, encoding, callback) {
    const source = fs.readFileSync(obj.filePath, 'utf8')
    const fileName = path.basename(obj.filePath)
    const input = JSON.stringify({
      language: 'Solidity',
      sources: {
        [fileName]: {
          content: source
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': [ 'evm.deployedBytecode' ]
          }
        }
      }
    })
    const result = JSON.parse(solc.compileStandardWrapper(input))
    if (!result.contracts && result.errors) {
      for (const err of result.errors) {
        this.emit('err', err)
      }
      this.logger.info(`${obj.filePath} compilation failed`)
      callback()
      return
    }
    this.logger.info(`${obj.filePath} compiled`)
    if (result.contracts) {
      for (const item of Object.entries(result.contracts)) {
        for (const innerItem of Object.entries(item[1])) {
          const newObj = Object.assign(obj, {
            contract: {
              name: innerItem[0],
              bytecode: innerItem[1].evm.deployedBytecode.object
            }
          })
          this.push(newObj)
        }
      }
    }
    callback()
  }
}

module.exports = Compiler
