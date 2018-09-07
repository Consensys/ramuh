const fs = require('fs')
const tmp = require('tmp')
const path = require('path')
const { PassThrough } = require('stream')
const should = require('chai').should()

const Watcher = require('../../lib/watcher')
const { getLogger } = require('../../lib/logging')

const logger = getLogger({loglevel: 'error'})

describe('watcher', () => {
  it('should pipe file name of new .sol files on creation', done => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = PassThrough({objectMode: true})

    const filePath = path.resolve(tmpDir, 'test.sol')
    fs.writeFile(filePath, 'Hey there!', err => {
      should.not.exist(err)

      watcher.pipe(ts)
    })

    ts.on('data', data => {
      data.filePath.should.be.equal(filePath)
      watcher.stop()
      done()
    })
  })

  it('should not pipe file name of new files with non sol extension on creation', done => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = PassThrough({objectMode: true})

    const badFileName = 'test.abc'
    const fileNames = ['test1.sol', badFileName, 'test2.sol']
    for (let i = 0; i < fileNames.length; i++) {
      const filePath = path.resolve(tmpDir, fileNames[i])
      fs.writeFile(filePath, 'Hey there!', err => {
        should.not.exist(err)

        if (i === fileNames.length - 1) {
          watcher.pipe(ts)
        }
      })
    }

    let total = 0
    const notExpected = path.resolve(tmpDir, badFileName)
    ts.on('data', data => {
      total++
      data.filePath.should.not.be.equal(notExpected)
      if (total === fileNames.length - 1) {
        watcher.stop()
        done()
      }
    })
  })

  it('should pipe file name of new .sol files on creation only once', done => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = PassThrough({objectMode: true})

    const fileCreation = (name, doPipe) => {
      const filePath = path.resolve(tmpDir, name)
      fs.writeFile(filePath, 'Hey there!', err => {
        should.not.exist(err)
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
    ts.on('data', data => {
      total++
      const actual = data.filePath
      if (actual === expected && !found) {
        found = true
        return
      }
      if (found) {
        actual.should.not.be.equal(expected)
      }
      if (total === 3) {
        watcher.stop()
        done()
      }
    })
  })

  it('should pipe file name of .sol files on changes', done => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = PassThrough({objectMode: true})

    const filePath = path.resolve(tmpDir, 'test.sol')
    fs.writeFile(filePath, 'Hey there!', err => {
      should.not.exist(err)
      watcher.pipe(ts)
      setTimeout(fs.appendFile, 50, filePath, 'more data, yay!', err => {
        should.not.exist(err)
      })
    })

    let created = false
    ts.on('data', data => {
      data.filePath.should.be.equal(filePath)
      if (created === false) {
        created = true
      } else {
        watcher.stop()
        done()
      }
    })
  })

  it('should pipe file name of new .sol files created on subfolders', done => {
    const tmpDir = tmp.dirSync().name
    const watcher = new Watcher({contractsPath: tmpDir, pollingStep: 10, logger: logger})

    const ts = PassThrough({objectMode: true})

    const subFolder = path.resolve(tmpDir, 'sub')
    fs.mkdirSync(subFolder)

    const filePath = path.resolve(subFolder, 'test.sol')
    fs.writeFile(filePath, 'Hey there!', err => {
      should.not.exist(err)

      watcher.pipe(ts)
    })

    ts.on('data', data => {
      data.filePath.should.equal(filePath)
      watcher.stop()
      done()
    })
  })
})
