const tape = require('tape')
const Watcher = require('../lib/watcher')
const fs = require('fs')
const tmp = require('tmp')
const path = require('path')
const through = require('through')
const { getLogger } = require('../lib/logging')
const logger = getLogger({loglevel: 'error'})

tape('[WATCHER]: observed files', t => {
  t.test('should pipe file name of new .sol files on creation', st => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = through(function write (data) {
      this.emit('data', data)
    })

    const filePath = path.resolve(tmpDir, 'test.sol')
    fs.writeFile(filePath, 'Hey there!', function (err) {
      st.error(err, 'writing file succeeded')

      watcher.pipe(ts)
    })

    ts.on('data', function (data) {
      const actual = data.toString('utf8')
      st.equal(actual, filePath)
      watcher.stop()
      st.end()
    })
  })

  t.test('should not pipe file name of new files with non sol extension on creation', st => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = through(function write (data) {
      this.emit('data', data)
    })

    const badFileName = 'test.abc'
    let fileNames = ['test1.sol', badFileName, 'test2.sol']
    for (let i = 0; i < fileNames.length; i++) {
      const filePath = path.resolve(tmpDir, fileNames[i])
      fs.writeFile(filePath, 'Hey there!', function (err) {
        st.error(err, `writing ${filePath} succeeded`)

        if (i === fileNames.length - 1) {
          watcher.pipe(ts)
        }
      })
    }

    let total = 0
    const notExpected = path.resolve(tmpDir, badFileName)
    ts.on('data', function (data) {
      total++
      const actual = data.toString('utf8')
      st.notEqual(actual, notExpected, 'non .sol files should not be sent')
      if (total === fileNames.length - 1) {
        watcher.stop()
        st.end()
      }
    })
  })

  t.test('should pipe file name of new .sol files on creation only once', st => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = through(function write (data) {
      this.emit('data', data)
    })

    const fileCreation = (name, doPipe) => {
      const filePath = path.resolve(tmpDir, name)
      fs.writeFile(filePath, 'Hey there!', function (err) {
        st.error(err, `writing ${filePath} succeeded`)
        if (doPipe) {
          watcher.pipe(ts)
        }
      })
    }
    fileCreation('test.sol')
    setTimeout(fileCreation, 50, 'test.sol')
    setTimeout(fileCreation, 50, 'test2.sol')
    setTimeout(fileCreation, 50, 'test.sol')
    setTimeout(fileCreation, 50, 'test3.sol', true)

    let found = false
    let total = 0
    const expected = path.resolve(tmpDir, 'test.sol')
    ts.on('data', function (data) {
      total++
      const actual = data.toString('utf8')
      if (actual === expected && !found) {
        found = true
        return
      }
      if (found) {
        st.notEqual(actual, expected, `files should be sent only once, actual: ${actual}`)
      }
      if (total === 3) {
        watcher.stop()
        st.end()
      }
    })
  })

  t.test('should pipe file name of .sol files on changes', st => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = through(function write (data) {
      this.emit('data', data)
    })

    const filePath = path.resolve(tmpDir, 'test.sol')
    fs.writeFile(filePath, 'Hey there!', (err) => {
      st.error(err, 'writing file succeeded')
      watcher.pipe(ts)
      setTimeout(fs.appendFile, 50, filePath, 'more data, yay!', (err) => {
        st.error(err, 'appending to file succeeded')
      })
    })

    let created = false
    ts.on('data', function (data) {
      const actual = data.toString('utf8')
      st.equal(actual, filePath)
      if (created === false) {
        created = true
      } else {
        watcher.stop()
        st.end()
      }
    })
  })

  t.test('should pipe file name of new .sol files created on subfolders', st => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = through(function write (data) {
      this.emit('data', data)
    })

    const subFolder = path.resolve(tmpDir, 'sub')
    fs.mkdirSync(subFolder)

    const filePath = path.resolve(subFolder, 'test.sol')
    fs.writeFile(filePath, 'Hey there!', function (err) {
      st.error(err, 'writing file succeeded')

      watcher.pipe(ts)
    })

    ts.on('data', function (data) {
      const actual = data.toString('utf8')
      st.equal(actual, filePath)
      watcher.stop()
      st.end()
    })
  })
})
