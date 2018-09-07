#!/usr/bin/env node
'use strict'

const path = require('path')
const url = require('url')
const { Client } = require('armlet')

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
  logger.info('Starting ramuh...')

  // args validation
  const apiUrl = url.parse(args.apiUrl)
  if (apiUrl.hostname === null) {
    throw new Error(`${apiUrl} is not a valid URL`)
  }
  const analyzer = new Client({apiUrl: apiUrl, apiKey: args.apiKey})

  const pipeline = new Pipeline({
    contractsPath: args.contractspath,
    analyzer: analyzer,
    logger: logger
  })

  pipeline.run()
}

try {
  run()
} catch (err) {
  logger.error(err)
}
