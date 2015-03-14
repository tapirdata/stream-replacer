'use strict'
path = require 'path'
events = require 'events'
stream = require 'readable-stream'
BufferList = require 'bl'
_ = require 'lodash'

class SingleReplacer extends stream.Transform

  @optionNames = ['pattern', 'asyncReplace']

  constructor: (tag, options) ->
    super options
    if typeof tag == 'object'
      options = tag
      tag = options.tag
    else    
      options = options or {}
    @tag = tag
    @pattern = options.pattern
    @asyncReplace = options.asyncReplace
    @searchLwm = options.seatchLwm or 512
    @hoard = ''

  forward: (lwm, done) ->
    hoard = @hoard
    # console.log 'SingleReplacer#forward: hoard.length=%d hoard=%s...', hoard.length, hoard.slice 0, 32
    if hoard.length > lwm
      match = @pattern.exec hoard
      if match
        #console.log 'SingleReplacer#forward: match[0]=%s match.index=%d', match[0], match.index
        @asyncReplace match, @tag, (replacement) =>
          @push hoard.substr 0, match.index
          @push replacement
          @hoard = hoard.slice match.index + match[0].length
          process.nextTick =>
            @forward lwm, done
          return
        return
      # no match
      fwdIndex = hoard.length - lwm
      @push hoard.slice 0, fwdIndex
      @hoard = hoard.slice fwdIndex
    done()  
    return

  _transform: (chunk, enc, next) ->
    @hoard = @hoard + String chunk, enc
    @forward @searchLwm, next
    return

  _flush: (next) ->
    @forward 0, next



class VinylReplacer extends stream.Transform

  @SingleClass = SingleReplacer

  constructor: (options) ->
    super objectMode: true
    options = options or {}
    @tagger = options.tagger or (file) -> file.path
    @singleOptions = @createSingleOptions options

  createSingleOptions: (options) ->
    sopt = _.pick options, @constructor.SingleClass.optionNames
    sopt

  createSingleReplacer: (tag) ->
    new @constructor.SingleClass tag, @singleOptions

  _transform: (file, enc, next) ->
    singleReplacer = @createSingleReplacer @tagger file
    if file.isStream()
      file.contents = file.contents.pipe singleReplacer
      next null, file
    else
      singleReplacer.end file.contents, null
      bl = new BufferList (err, buffer) ->
        if err
          next err
          return
        file.contents = buffer
        next null, file
        return
      singleReplacer.pipe bl
    return  


factory = (options) ->
  if options and options.single
    new SingleReplacer options
  else  
    new VinylReplacer options

factory.SingleReplacer = SingleReplacer
factory.VinylReplacer = VinylReplacer
module.exports = factory


