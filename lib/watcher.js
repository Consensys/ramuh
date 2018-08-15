const Readable = require('stream').Readable
const chokidar = require('chokidar')

class Watcher extends Readable {
  constructor (options) {
    super()

    this.pollingStep = options.pollingStep || 1000
    this.pendingData = []
    this.shouldStop = false

    this._watcher = chokidar.watch(options.tmpDir)
    this._watcher.on('add', path => {
      if (path.split('.').pop() === 'sol' && !this.pendingData.includes(path)) {
        this.pendingData.push(path)
      }
    })
    // this._watcher.on('change', path => console.log(`File ${path} has been changed`))
  }

  _read () {
    let t = setTimeout(() => {
      if (this.shouldStop) {
        clearTimeout(t)
        this._watcher.close()
        this.push(null)
      } else {
        for (const item of this.pendingData) {
          this.push(item)
        }
        // this.pendingData.length = 0
      }
    }, this.pollingStep)
  }

  stop () {
    this.shouldStop = true
  }
}

module.exports = Watcher
