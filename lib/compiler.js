const Transform = require('stream').Transform
const fs = require('fs')

class Compiler extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger
    this.solc = options.solc
  }

  _transform (filePath, encoding, callback) {
    const source = fs.readFileSync(filePath, 'utf8')
    const result = this.solc.compile(source, 1)
    const data = {
      filePath: filePath,
      contracts: []
    }
    if (result.errors) {
      for (const err of result.errors) {
        this.emit('error', err)
      }
    }
    if (result.contracts) {
      for (const item of Object.entries(result.contracts)) {
        data.contracts.push({
          name: item[0],
          bytecode: item[1].bytecode
        })
      }
      this.push(data)
    }
    callback()
  }
}

module.exports = Compiler
