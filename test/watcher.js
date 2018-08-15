const tape = require('tape')
const Watcher = require('../lib/watcher')
const fs = require('fs')
const tmp = require('tmp')
const path = require('path')
const through = require('through')

const tmpdir = tmp.dirSync().name
const watcher = new Watcher(tmpdir)

tape('[WATCHER]: observed files', t => {
  t.test('should pipe file name of new .sol files on creation', st => {
    const ts = through(function write (data) {
      this.emit('data', data)
    })
    watcher.pipe(ts)

    const filePath = path.resolve(tmpdir, 'test.sol')
    fs.writeFile(filePath, 'Hey there!', function (err) {
      st.error(err, 'writing file succeeded')
    })

    ts.on('data', function (data) {
      const actual = data.toString('utf8')
      st.equal(actual, filePath)
      watcher.stop()
    })

    st.end()
  })

  t.test('should not pipe file name of new files with non sol extension on creation', st => {
    st.end()
  })

  t.test('should pipe file name of new .sol files on changes', st => {
    st.end()
  })

  t.test('should not pipe file name of new files with non sol extension on changes', st => {
    st.end()
  })

  t.test('should pipe file name of new .sol files created on subfolders', st => {
    st.end()
  })
})
