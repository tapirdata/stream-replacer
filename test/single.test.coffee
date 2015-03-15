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

    repl = repls[options.replName]
    srcPath = path.join __dirname, 'fixtures/src', options.srcName
    expPath = path.join __dirname, 'fixtures', repl.expDir, options.srcName

    digest = null
    destBuffer = null
    replaceError = null

    before (done) ->

      try
        replacer = streamReplacer
          single: true
          pattern: repl.pattern
          substitute: repl.substitute
      catch err
        replaceError = err
        done()
        return
      tapper = vinylTapper
        single: true
        terminate: true
        provideBuffer: true
      tapper.on 'tap', (buffer) ->
        destBuffer = buffer

      fs.createReadStream srcPath
      .pipe replacer
      .on 'error', (err) -> 
        replaceError = err
        done()
      .pipe tapper
      .on 'end', done

    if repl.fails
      it 'should fail', ->
        expect(replaceError).to.be.an.instanceOf repl.fails 
    else  
      it 'should replace contents', (done) ->
        fs.readFile expPath, (err, expBuffer) ->
          expect(destBuffer.length).to.be.equal expBuffer.length
          expect(destBuffer.toString 'utf8').to.be.equal expBuffer.toString 'utf8'
          done()

     
describe 'stream-replacer for single stream', ->

  @timeout 10000

  makeTests 'with bad pattern',
    srcName: 'eels.txt'
    replName: 'badPattern'

  makeTests 'with bad substitute',
    srcName: 'eels.txt'
    replName: 'badSubstitute'

  makeTests 'with short file, search only',
    srcName: 'eels.txt'
    replName: 'search'

  makeTests 'with short file, search sync only',
    srcName: 'eels.txt'
    replName: 'searchSync'

  makeTests 'with long file, search only',
    srcName: 'lorem.txt'
    replName: 'search'

  makeTests 'with short file, simple replace',
    srcName: 'eels.txt'
    replName: 'simple'

  makeTests 'with long file, simple replace',
    srcName: 'lorem.txt'
    replName: 'simple'

  makeTests 'with short file, simple sync replace',
    srcName: 'eels.txt'
    replName: 'simpleSync'

  makeTests 'with short file, simple promise replace',
    srcName: 'eels.txt'
    replName: 'simplePromise'

  makeTests 'with short file, throw on substitute',
    srcName: 'eels.txt'
    replName: 'failSubstitute'

  makeTests 'with short file, capitalize replace',
    srcName: 'eels.txt'
    replName: 'cap'

  makeTests 'with long file, capitalize replace',
    srcName: 'lorem.txt'
    replName: 'cap'


