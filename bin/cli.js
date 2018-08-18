#!/usr/bin/env node
'use strict'

const path = require('path')

const Watcher = require('../lib/watcher')
const Compiler = require('../lib/compiler')
const Requester = require('../lib/requester')
const Poller = require('../lib/poller')
const { getLogger } = require('../lib/logging')

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

  const watcher = new Watcher({logger: logger, contractsPath: args.contractspath})
  const compiler = new Compiler({logger: logger})
  const requester = new Requester({
    logger: logger,
    apiHostname: args.apihostname,
    apiKey: args.apikey})
  const poller = new Poller({
    logger: logger,
    apiHostname: args.apihostname,
    apiKey: args.apikey})

  const errorHandler = (err) => logger.error(err)
  watcher.on('error', errorHandler)
  compiler.on('error', errorHandler)
  requester.on('error', errorHandler)
  poller.on('error', errorHandler)

  // main pipeline, each step adds info to the object in transit

  // watcher adds paths of .sol files created/changed
  watcher
  // for each contract, compiler adds name and bytecode
    .pipe(compiler)
  // requester adds uuid of the requested analysis
    .pipe(requester)
  // poller adds issues returned by the API
    .pipe(poller)
}

try {
  run()
} catch (err) {
  logger.error(err)
}
