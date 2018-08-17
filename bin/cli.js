#!/usr/bin/env node
'use strict'

const { getLogger } = require('../lib/logging')
const path = require('path')
const Watcher = require('../lib/watcher')
const Compiler = require('../lib/compiler')

const args = require('yargs')
  .options({
    'contractspath': {
      describe: 'relative path to watch contract files',
      default: path.resolve(__dirname, '..', 'contracts')
    },
    'apihostname': {
      describe: 'Hostname of Mythril API server',
      default: 'localhost:3100'
    },
    'apikey': {
      describe: 'API key for accessing Mytrhil',
      default: 'localhost:3100'
    },
    'loglevel': {
      describe: 'Logging verbosity',
      choices: [ 'error', 'warn', 'info', 'debug' ],
      default: 'info'
    }
  })
  .locale('en_EN')
  .argv
const logger = getLogger({loglevel: args.loglevel})

function run () {
  logger.info('Starting ithildin...')

  const worker = new Watcher({logger: logger, contractsPath: args.contractspath})
  const compiler = new Compiler({logger: logger})

  const errorHandler = (err) => logger.error(err)
  worker.on('error', errorHandler)
  compiler.on('error', errorHandler)

  worker.pipe(compiler)
}

try {
  run()
} catch (err) {
  logger.error(err)
}
