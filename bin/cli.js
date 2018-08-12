#!/usr/bin/env node
'use strict'

const { getLogger } = require('../lib/logging')
const os = require('os')
const path = require('path')

const args = require('yargs')
  .options({
    'contractspath': {
      describe: 'relative path to watch contract files',
      default: path.join(__dirname, 'contracts')
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

}

try {
  run()
} catch (err) {
  logger.error(err)
}
