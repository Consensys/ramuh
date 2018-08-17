#!/usr/bin/env node
'use strict'

const { getLogger } = require('../lib/logging')
const os = require('os')
const path = require('path')
const Watcher = require('../lib/watcher')
const Compiler = require('../lib/compiler')

const args = require('yargs')
  .options({
    'contractspath': {
      describe: 'relative path to watch contract files',
      default: path.resolve(__dirname, '..', 'contracts')
    },
    'apiaddress': {
      describe: 'Address of Mythril API',
      default: 'localhost:3100'
    },
    'apikey': {
      describe: 'API key for accessing Mytrhil',
      default: 'localhost:3100'
    },
    'datadir': {
      describe: 'Data directory to store status analysis',
      default: `${os.homedir()}/Library/Ethereum`
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

  const w = new Watcher({logger: logger, contractsPath: args.contractspath})
  const c = new Compiler({logger: logger})

  const errorHandler = (err) => logger.error(err)
  w.on('error', errorHandler)
  c.on('error', errorHandler)

  w.pipe(c)
}

try {
  run()
} catch (err) {
  logger.error(err)
}
