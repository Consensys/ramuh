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
      res.on('data', function (dataStr) {
        const data = JSON.parse(dataStr)
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
