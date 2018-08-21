const Transform = require('stream').Transform
const fs = require('fs')

class Resultwriter extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger

    this.contractsPath = options.contractsPath
  }

  _transform (obj, encoding, callback) {
    const defaultSufix = '.mythril'
    const targetFile = obj.filePath + defaultSufix
    const contents = JSON.stringify(obj.analysis.issues)
    const self = this

    fs.writeFile(targetFile, contents, (err) => {
      if (err) {
        self.emit('err', `Could not write results file ${targetFile}: ${err}`)
        callback()
        return
      }
      const newObj = Object.assign(obj, {
        results: {
          path: targetFile
        }
      })
      self.push(newObj)
      callback()
    })
  }
}

module.exports = Resultwriter
