const { Transform } = require('stream')

class Client extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger
    this.analyzer = options.analyzer
  }

  _transform (obj, encoding, callback) {
    const clonedObj = JSON.parse(JSON.stringify(obj))
    this._handleObj(clonedObj, callback)
  }
  _handleObj (obj, callback) {
    this.analyzer.analyze({bytecode: obj.contract.bytecode})
      .then(issues => {
        const newObj = Object.assign(obj, {})
        newObj.analysis = {issues: issues}
        this.push(newObj)
        callback()
      }).catch(err => console.log(err))
  }
}

module.exports = Client
