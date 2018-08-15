const Readable = require('stream').Readable
const chokidar = require('chokidar')

class Watcher extends Readable {
  constructor (tmpDir) {
    super()

    this.pendingData = []
    this.shouldStop = false

    this._watcher = chokidar.watch(tmpDir)
    this._watcher.on('add', path => {
      if (!this.pendingData.includes(path)) {
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
        for (let item of this.pendingData) {
          this.push(item)
        }
        this.pendingData.length = 0
      }
    }, 10)
  }

  stop () {
    console.log('closing watcher')
    this.shouldStop = true
  }
}

module.exports = Watcher
