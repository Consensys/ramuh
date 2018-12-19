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
      default: 'https://api.mythx.io'
    },
    'apikey': {
      describe: 'API key for accessing MythX Platform',
      default: process.env.MYTHX_API_KEY
    },
    'ethaddress': {
      describe: 'Eth address for accessing MythX Platform',
      default: process.env.MYTHX_ETH_ADDRESS
    },
    'password': {
      describe: 'Password for accessing MythX Platform',
      default: process.env.MYTHX_PASSWORD
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
  const apiUrl = url.parse(args.apiurl)
  if (apiUrl.hostname === null) {
    throw new Error(`${apiUrl} is not a valid URL`)
  }
  const analyzer = new Client({apiKey: args.apikey, ethAddress: args.ethaddress, password: args.password}, apiUrl)

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
