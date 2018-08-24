const { Transform } = require('stream')
const fs = require('fs')
const beautify = require('json-beautify')

class Resultwriter extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger
  }

  _transform (obj, encoding, callback) {
    const targetFile = [obj.filePath, obj.contract.name, 'mythril'].join('.')
    const contents = beautify(obj.analysis.issues, null, 2, 80)
    const self = this

    fs.writeFile(targetFile, contents, (err) => {
      if (err) {
        self.emit('err', `Could not write results file ${targetFile}: ${err}`)
        callback()
        return
      }
      this.logger.info(`Results written to ${targetFile}`)
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
