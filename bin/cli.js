#!/usr/bin/env node
'use strict'

const path = require('path')
const url = require('url')

const Watcher = require('../lib/watcher')
const Compiler = require('../lib/compiler')
const Requester = require('../lib/requester')
const Poller = require('../lib/poller')
const ResultWriter = require('../lib/result_writer')
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

  // args validation
  const apiUrl = url.parse(args.apiurl)
  if (apiUrl.hostname === null) {
    throw new Error(`${args.apiurl} is not a valid URL`)
  }

  const watcher = new Watcher({logger: logger, contractsPath: args.contractspath})
  const compiler = new Compiler({logger: logger})
  const requester = new Requester({
    logger: logger,
    apiUrl: apiUrl,
    apiKey: args.apikey})
  const poller = new Poller({
    logger: logger,
    apiUrl: apiUrl,
    apiKey: args.apikey})
  const resultWriter = new ResultWriter({logger: logger})

  const errorHandler = (err) => logger.error(err)
  watcher.on('err', errorHandler)
  compiler.on('err', errorHandler)
  requester.on('err', errorHandler)
  poller.on('err', errorHandler)
  resultWriter.on('err', errorHandler)

  // main pipeline, each step performs some required functionality and adds info
  // to the object in transit.

  // watcher looks into an specific directory and starts the pipeline, adds paths
  // of .sol files created/changed.
  watcher
  // for each contract in each of the changed/added files, compiler compiles it
  // and adds its name and bytecode to the object down the pipeline.
    .pipe(compiler)
  // requester sends an analysis request to the API and adds uuid of the
  // requested analysis.
    .pipe(requester)
  // poller keeps querying the API until it gets the analysis results, then adds
  // the returned issues to the in-transit object.
    .pipe(poller)
  // resultWriter writes down a file with the issues and adds its path.
    .pipe(resultWriter)
}

try {
  run()
} catch (err) {
  logger.error(err)
}
