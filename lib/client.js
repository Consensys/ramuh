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
    const sources = {}
    sources[obj.contract.fileName] = obj.contract.source
    const options = {
      analysisMode: 'full',
      contractName: obj.contract.name,
      bytecode: obj.contract.bytecode,
      deployedBytecode: obj.contract.deployedBytecode,
      sources,
      sourceList: [obj.contract.fileName],
      sourceMap: obj.contract.sourceMap,
      deployedSourceMap: obj.contract.deployedSourceMap
    }
    this.analyzer.analyze(options)
      .then(issues => {
        const newObj = Object.assign(obj, {})
        newObj.analysis = {issues}
        this.push(newObj)
        callback()
      }).catch(err => console.log(err))
  }
}

module.exports = Client
