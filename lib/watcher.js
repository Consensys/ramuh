const Readable = require('stream').Readable
const chokidar = require('chokidar')

class Watcher extends Readable {
  constructor (options) {
    super({objectMode: true})

    this.pollingStep = options.pollingStep || 1000
    this.logger = options.logger
    this.pendingData = []
    this.shouldStop = false

    this.logger.info(`Start watching ${options.contractsPath}...`)

    this._watcher = chokidar.watch(options.contractsPath)

    this._watcher.on('add', path => {
      if (this._shouldAdd(path)) {
        this.logger.info(`${path} added`)
        this.pendingData.push(path)
      }
    })

    this._watcher.on('change', path => {
      if (this._shouldAdd(path)) {
        this.logger.info(`${path} changed`)
        this.pendingData.push(path)
      }
    })
  }

  _read () {
    let t = setInterval(() => {
      if (this.shouldStop) {
        clearInterval(t)
        this._watcher.close()
        this.push(null)
      } else {
        for (const item of this.pendingData) {
          this.push({filePath: item})
        }
        this.pendingData.length = 0
      }
    }, this.pollingStep)
  }

  stop () {
    this.shouldStop = true
  }

  _shouldAdd (path) {
    return path.split('.').pop() === 'sol' && !this.pendingData.includes(path)
  }
}

module.exports = Watcher
