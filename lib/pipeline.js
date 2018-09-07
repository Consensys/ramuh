const Watcher = require('./watcher')
const Compiler = require('./compiler')
const Client = require('./client')
const ResultWriter = require('./result_writer')
const Notifier = require('./notifier')

class Pipeline {
  constructor (options) {
    this.analyzer = options.analyzer
    this.contractsPath = options.contractsPath

    this.logger = options.logger
  }

  run () {
    const watcher = new Watcher({logger: this.logger, contractsPath: this.contractsPath})
    const compiler = new Compiler({logger: this.logger})
    const client = new Client({analyzer: this.analyzer})
    const resultWriter = new ResultWriter({logger: this.logger})
    const notifier = new Notifier({logger: this.logger})

    const errorHandler = (err) => this.logger.error(err)
    watcher.on('err', errorHandler)
    compiler.on('err', errorHandler)
    client.on('err', errorHandler)
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
    // client sends an analysis request to the API, polls for the results and adds
    // the returned issues to the in-transit object.
      .pipe(client)
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
