const tape = require('tape')
const Watcher = require('../lib/watcher')
const fs = require('fs')
const tmp = require('tmp')
const path = require('path')
const through = require('through')

tape('[WATCHER]: observed files', t => {
  t.test('should pipe file name of new .sol files on creation', st => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({tmpDir: tmpDir, pollingStep: 10})

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
    const watcher = new Watcher({tmpDir: tmpDir, pollingStep: 10})

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
    st.end()
  })

  t.test('should pipe file name of new .sol files on changes', st => {
    st.end()
  })

  t.test('should not pipe file name of new files with non sol extension on changes', st => {
    st.end()
  })

  t.test('should pipe file name of new .sol files on changes only once', st => {
    st.end()
  })

  t.test('should pipe file name of new .sol files created on subfolders', st => {
    st.end()
  })
})
