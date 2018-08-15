const Transform = require('stream').Transform
const fs = require('fs')
const solc = require('solc')

class Compiler extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger
  }

  _transform (filePath, encoding, callback) {
    const source = fs.readFileSync(filePath, 'utf8')
    const result = solc.compile(source, 1)
    for (let item of Object.entries(result.contracts)) {
      this.push({
        filePath: filePath,
        contract: item[0],
        bytecode: item[1].bytecode
      })
    }
    callback()
  }
}

module.exports = Compiler
