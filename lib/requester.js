const { Transform } = require('stream')

const basePath = '/mythril/v1/analysis'

class Requester extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger

    this.apiUrl = options.apiUrl
    this.apiKey = options.apiKey
    this.lib = this.apiUrl.protocol === 'http:' ? require('http') : require('https')
  }

  _transform (obj, encoding, callback) {
    const postData = JSON.stringify({
      type: 'bytecode',
      contract: obj.contract.bytecode
    })
    const postOptions = {
      protocol: this.apiUrl.protocol,
      hostname: this.apiUrl.hostname,
      port: this.apiUrl.port,
      path: basePath,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-type': 'application/json',
        'Content-length': postData.length
      }
    }

    const clonedObj = JSON.parse(JSON.stringify(obj))
    const postRequest = this._generateRequest(clonedObj, postOptions, callback)

    postRequest.on('error', (err) => {
      if (err.errno === 'ENOTFOUND') {
        this.emit('err', `Could not connect to API server at ${this.apiUrl.href}`)
      }
    })
    postRequest.write(postData)
    postRequest.end()
  }

  _generateRequest (obj, postOptions, callback) {
    const self = this
    const errMap = new Map([
      [400, 'validation failed'],
      [401, `unauthorized analysis request, API key: ${this.apiKey}`],
      [429, 'request limit exceeded'],
      [500, 'received error from API server']])
    return this.lib.request(postOptions, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        self.emit('err', `Failed to get response, status code ${res.statusCode}: ${errMap.get(res.statusCode)}`)
        callback()
        return
      }

      let rawData = ''
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        const data = JSON.parse(rawData)
        const newObj = Object.assign(obj, {
          analysis: {
            uuid: data.uuid
          }
        })
        self.push(newObj)
        callback()
      })
    })
  }
}

module.exports = Requester
