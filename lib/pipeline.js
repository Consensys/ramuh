const url = require('url')

const Watcher = require('./watcher')
const Compiler = require('./compiler')
const Requester = require('./requester')
const Poller = require('./poller')
const ResultWriter = require('./result_writer')
const Notifier = require('./notifier')

class Pipeline {
  constructor (contractsPath, apiUrl, apiKey, logger) {
    // args validation
    const parsedApiUrl = url.parse(apiUrl)
    if (apiUrl.hostname === null) {
      throw new Error(`${apiUrl} is not a valid URL`)
    }
    this.apiUrl = parsedApiUrl
    this.apiKey = apiKey
    this.contractsPath = contractsPath

    this.logger = logger
  }

  run () {
    const watcher = new Watcher({logger: this.logger, contractsPath: this.contractsPath})
    const compiler = new Compiler({logger: this.logger})
    const requester = new Requester({
      logger: this.logger,
      apiUrl: this.apiUrl,
      apiKey: this.apiKey})
    const poller = new Poller({
      logger: this.logger,
      apiUrl: this.apiUrl,
      apiKey: this.apiKey})
    const resultWriter = new ResultWriter({logger: this.logger})
    const notifier = new Notifier({logger: this.logger})

    const errorHandler = (err) => this.logger.error(err)
    watcher.on('err', errorHandler)
    compiler.on('err', errorHandler)
    requester.on('err', errorHandler)
    poller.on('err', errorHandler)
    resultWriter.on('err', errorHandler)
    notifier.on('err', errorHandler)

    // main pipeline, each step performs some required functionality and adds info
    // to the object in transit.
    this.origin = watcher

    // watcher looks into an specific directory and starts the pipeline, adds paths
    // of .sol files created/changed.
    return watcher
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
    // notifier shows a desktop notification if the analysis returned issues.
      .pipe(notifier)
  }

  stop () {
    this.origin.stop()
  }
}

module.exports = Pipeline
