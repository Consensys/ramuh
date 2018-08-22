const Transform = require('stream').Transform

const basePath = '/mythril/v1/analysis'

class Requester extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger

    this.apiUrl = options.apiUrl
    this.apiKey = options.apiKey
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
    const self = this
    const lib = this.apiUrl.protocol === 'http:' ? require('http') : require('https')
    const postRequest = lib.request(postOptions, (res) => {
      if (res.statusCode === 400) {
        self.emit('err', `Validation failed`)
        callback()
        return
      }
      if (res.statusCode === 401) {
        self.emit('err', `Unauthorized analysis request, API key: ${this.apiKey}`)
        callback()
        return
      }
      if (res.statusCode === 429) {
        self.emit('err', `Request limit exceeded`)
        callback()
        return
      }
      if (res.statusCode === 500) {
        self.emit('err', 'received error 500 from API server')
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
    postRequest.on('error', (err) => {
      if (err.errno === 'ENOTFOUND') {
        this.emit('err', `could not connect to API server at ${this.apiUrl.href}`)
      }
    })
    postRequest.write(postData)
    postRequest.end()
  }
}

module.exports = Requester
