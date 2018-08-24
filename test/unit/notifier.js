const tape = require('tape')
const nodeNotifier = require('node-notifier')
const sinon = require('sinon')
const { PassThrough } = require('stream')
const Notifier = require('../../lib/notifier')
const { getLogger } = require('../../lib/logging')

const logger = getLogger({loglevel: 'err'})
const filePath = 'file-path'
const resultsPath = 'results-path'

tape('[NOTIFIER]: general functionallity', t => {
  t.test('setup', st => {
    sinon.stub(nodeNotifier, 'notify')

    st.end()
  })
  t.test('should send notifications on issues', st => {
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

    target.on('data', (data) => {
      st.ok(data.notified)

      st.end()
    })
  })

  t.test('should not  send notifications on empty issues', st => {
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

    target.on('data', (data) => {
      st.notok(data.notified)

      st.end()
    })
  })

  t.test('teardown', st => {
    nodeNotifier.notify.restore()

    st.end()
  })
})
