const Transform = require('stream').Transform
const fs = require('fs')
const solc = require('solc')

class Compiler extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger
  }

  _transform (obj, encoding, callback) {
    const source = fs.readFileSync(obj.filePath, 'utf8')
    const result = solc.compile(source, 1)
    if (result.errors) {
      for (const err of result.errors) {
        this.emit('error', err)
      }
    }
    if (result.contracts) {
      for (const item of Object.entries(result.contracts)) {
        const newObj = Object.assign(obj, {
          contract: {
            name: item[0],
            bytecode: item[1].bytecode
          }
        })
        this.push(newObj)
      }
    }
    callback()
  }
}

module.exports = Compiler
