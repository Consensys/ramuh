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
          let rawData = ''
          res.on('data', (chunk) => { rawData += chunk })
          res.on('end', () => {
            const data = JSON.parse(rawData)
            if (res.statusCode === 200) {
              const newObj = Object.assign(obj, {
                analysis: {
                  issues: data
                }
              })
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
