const Transform = require('stream').Transform
const http = require('http')

class Poller extends Transform {
  constructor (options) {
    super({objectMode: true})

    this.logger = options.logger

    this.apiHostname = options.apiHostname
    this.apiKey = options.apiKey
    this.pollStep = options.pollStep || 1000
  }

  _transform (obj, encoding, callback) {
    const getOptions = {
      hostname: this.apiHostname,
      port: 3100,
      path: `/mythril/v1/analysis/${obj.analysis.uuid}/issues`,
      headers: {
        authorization: `Bearer ${this.apiKey}`
      }
    }
    const self = this
    const getFunc = () => {
      http.get(
        getOptions,
        (res) => {
          if (res.statusCode === 500) {
            self.emit('error', 'received error 500 from API server')
            clearInterval(intervalID)
            callback()
            return
          }
          if (res.statusCode === 401) {
            self.emit('error', `Unauthorized analysis request, API key: ${this.apiKey}`)
            clearInterval(intervalID)
            callback()
            return
          }
          let rawData = ''
          res.on('data', (chunk) => { rawData += chunk })
          res.on('end', () => {
            self.logger.info('analysis result received from server')
            const data = JSON.parse(rawData)
            if (res.statusCode === 200) {
              const newObj = Object.assign(obj, {})
              newObj.analysis.issues = data
              self.push(newObj)
              clearInterval(intervalID)
              callback()
            }
          })
        }
      )
    }
    const intervalID = setInterval(getFunc, this.pollStep)
  }
}

module.exports = Poller
