fs = require 'fs'
path = require 'path'
_ = require 'lodash'
vinylFs = require 'vinyl-fs'
vinylTapper = require 'vinyl-tapper'
chai = require 'chai'
expect = chai.expect
streamReplacer = require '../src'
repls = require './repls'

fileCount = 1

makeTests = (title, options) ->

  describe title, ->

    tapResults = {}

    before (done) ->
      repl = repls[options.replName]

      replacer = streamReplacer
        pattern: repl.pattern
        asyncReplace: repl.asyncReplace

      tapper = vinylTapper
        provideBuffer: true
        terminate: true
      tapper.on 'tap', (file, buffer) ->
        tapResults[file.relative] = 
          file: file
          buffer: buffer

      well = vinylFs.src 'fixtures/src/**/eels.*',
        cwd: __dirname
        buffer: options.useBuffer
      well
        .pipe replacer
        .pipe tapper
        .on 'end', done

    it 'should pass all files', ->
      expect(_.keys tapResults).to.have.length fileCount

    it 'should replace contents in all files', (done) ->
      restCount = fileCount
      for srcRelative, {file: destFile, buffer: destBuffer} of tapResults
        expPath = path.join __dirname, 'fixtures/exp-' + options.replName, srcRelative
        do (expPath, destBuffer) ->
          fs.readFile expPath, (err, expBuffer) ->
            expect(destBuffer.length).to.be.equal expBuffer.length
            expect(destBuffer.toString 'utf8').to.be.equal expBuffer.toString 'utf8'
            if --restCount == 0
              done()

    it 'should pass file types unmodified', ->
      for srcRelative, {file: destFile, buffer: destBuffer} of tapResults
        expect(destFile.isBuffer()).to.be.equal options.useBuffer


describe 'stream-replacer for vinly-stream', ->

  makeTests 'with buffer-files, simple replace',
    useBuffer: true
    replName: 'simple'

  makeTests 'with stream-files, simple replace',
    useBuffer: false
    replName: 'simple'

  makeTests 'with buffer-files, capitalize replace',
    useBuffer: true
    replName: 'cap'

  makeTests 'with stream-files, capitalize replace',
    useBuffer: false
    replName: 'cap'

