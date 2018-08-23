#!/usr/bin/env node
'use strict'

const path = require('path')

const Pipeline = require('../lib/pipeline')
const { getLogger } = require('../lib/logging')

const args = require('yargs')
  .options({
    'contractspath': {
      describe: 'relative path to watch contract files',
      default: path.resolve(__dirname, '..', 'contracts')
    },
    'apiurl': {
      describe: 'URL of Mythril API server',
      default: 'https://api.mythril.ai'
    },
    'apikey': {
      describe: 'API key for accessing Mytrhil'
    },
    'loglevel': {
      describe: 'Logging verbosity',
      choices: [ 'err', 'warn', 'info', 'debug' ],
      default: 'info'
    }
  })
  .locale('en_EN')
  .argv
const logger = getLogger({loglevel: args.loglevel})

function run () {
  logger.info('Starting ithildin...')

  const pipeline = new Pipeline(args.contractspath, args.apiurl, args.apikey, logger)

  pipeline.run()
}

try {
  run()
} catch (err) {
  logger.error(err)
}
