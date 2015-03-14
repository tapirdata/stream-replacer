fs = require 'fs'
path = require 'path'
_ = require 'lodash'
vinylTapper = require 'vinyl-tapper'
chai = require 'chai'
expect = chai.expect
streamReplacer = require '../src'
repls = require './repls'


makeTests = (title, options) ->

  describe title, ->

    srcPath = path.join __dirname, 'fixtures/src', options.srcName
    expPath = path.join __dirname, 'fixtures/exp-' + options.replName, options.srcName

    digest = null
    destBuffer = null

    before (done) ->
      repl = repls[options.replName]

      replacer = streamReplacer
        single: true
        pattern: repl.pattern
        substitute: repl.substitute
      tapper = vinylTapper
        single: true
        terminate: true
        provideBuffer: true
      tapper.on 'tap', (buffer) ->
        destBuffer = buffer

      fs.createReadStream srcPath
      .pipe replacer
      .pipe tapper
      .on 'end', done

    it 'should replace contents', (done) ->
      fs.readFile expPath, (err, expBuffer) ->
        expect(destBuffer.length).to.be.equal expBuffer.length
        expect(destBuffer.toString 'utf8').to.be.equal expBuffer.toString 'utf8'
        done()

     
describe 'stream-replacer for single stream', ->

  @timeout 10000

  makeTests 'with short file, search only',
    srcName: 'eels.txt'
    replName: 'search'

  makeTests 'with long file, search only',
    srcName: 'lorem.txt'
    replName: 'search'

  makeTests 'with short file, simple replace',
    srcName: 'eels.txt'
    replName: 'simple'

  makeTests 'with long file, simple replace',
    srcName: 'lorem.txt'
    replName: 'simple'

  makeTests 'with short file, capitalize replace',
    srcName: 'eels.txt'
    replName: 'cap'

  makeTests 'with long file, capitalize replace',
    srcName: 'lorem.txt'
    replName: 'cap'


