const { Transform } = require('stream')
const notifier = require('node-notifier')
const path = require('path')

class Notifier extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger
  }

  _transform (obj, encoding, callback) {
    let notified = false
    if (obj.analysis.issues.length > 0) {
      notifier.notify({
        title: `Security issues detected`,
        message: `
Mythril detected security issues in ${obj.filePath}.

Please check the analysis output in ${obj.results.path}.`,
        icon: path.resolve(__dirname, '..', 'img', 'mythril.jpg'),
        timeout: 5
      })
      notified = true
    }
    const newObj = Object.assign(obj, {
      notified: notified
    })
    this.push(newObj)
    callback()
  }
}

module.exports = Notifier
