/* eslint no-unused-expressions: 0 */
const nodeNotifier = require('node-notifier')
const sinon = require('sinon')
const { PassThrough } = require('stream')

const Notifier = require('../../lib/notifier')
const { getLogger } = require('../../lib/logging')

const logger = getLogger({loglevel: 'err'})
const filePath = 'file-path'
const resultsPath = 'results-path'

describe('notifier', () => {
  beforeEach(() => {
    sinon.stub(nodeNotifier, 'notify')
  })

  afterEach(() => {
    nodeNotifier.notify.restore()
  })

  it('should send notifications on issues', done => {
    const issueName = 'issue-name'

    const notifier = new Notifier({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.pipe(notifier).pipe(target)

    origin.write({
      filePath: filePath,
      results: {
        path: resultsPath
      },
      analysis: {
        issues: [
          {
            name: issueName
          }
        ]
      }
    })

    target.on('data', data => {
      data.notified.should.be.true

      done()
    })
  })

  it('should not  send notifications on empty issues', done => {
    const notifier = new Notifier({logger: logger})

    const origin = PassThrough({objectMode: true})
    const target = PassThrough({objectMode: true})

    origin.pipe(notifier).pipe(target)

    origin.write({
      filePath: filePath,
      results: {
        path: resultsPath
      },
      analysis: {
        issues: []
      }
    })

    target.on('data', data => {
      data.notified.should.not.be.true

      done()
    })
  })
})
