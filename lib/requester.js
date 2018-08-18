const Transform = require('stream').Transform
const http = require('http')

const basePath = '/mythril/v1/analysis'

class Requester extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger

    this.apiHostname = options.apiHostname
    this.apiKey = options.apiKey
  }

  _transform (obj, encoding, callback) {
    const postOptions = {
      host: this.apiHostname,
      port: '3100',
      path: basePath,
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`
      }
    }
    const self = this
    const postRequest = http.request(postOptions, (res) => {
      if (res.statusCode === 500) {
        self.emit('error', 'received error 500 from API server')
        callback()
        return
      }
      if (res.statusCode === 401) {
        self.emit('error', `Unauthorized analysis request, API key: ${this.apiKey}`)
        callback()
        return
      }
      let rawData = ''
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        self.logger.info('analysis requested')
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
    postRequest.write(JSON.stringify({
      type: 'bytecode',
      contract: obj.contract.bytecode
    }))
    postRequest.end()
  }
}

module.exports = Requester
