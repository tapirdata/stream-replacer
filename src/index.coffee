'use strict'
assert = require 'assert'
path = require 'path'
events = require 'events'
stream = require 'readable-stream'
BufferList = require 'bl'
_ = require 'lodash'

class SingleReplacer extends stream.Transform

  @optionNames = ['pattern', 'substitute']

  constructor: (tag, options) ->
    super options
    if typeof tag == 'object'
      options = tag
      tag = options.tag
    else    
      options = options or {}
    @tag = tag
    if options.pattern?
      assert options.pattern instanceof RegExp, 'pattern must be a RegExp'
      assert typeof options.substitute == 'function', 'substitute must be a function'
    @pattern = options.pattern
    @substitute = options.substitute
    @searchLwm = options.searchLwm or 1024
    @hoard = ''

  _substitute: (match, done) ->
    result = @substitute match, @tag, (err, replacement) ->
      if result != undefined
        done new Error 'callback used after sync return'
      else   
        done err, replacement
      return
    if typeof result == 'string' or result == null
      done null, result
      return
    if typeof result == 'object' and typeof result.then == 'function'
      result.then(
        (replacement) -> done null, replacement
        (err) -> done err
      )  
    return  

  forward: (lwm, done) ->
    hoard = @hoard
    # console.log 'SingleReplacer#forward: hoard.length=%d hoard=%s...', hoard.length, hoard.slice 0, 32
    if hoard.length > lwm
      match = @pattern.exec hoard
      if match
        #console.log 'SingleReplacer#forward: match[0]=%s match.index=%d', match[0], match.index
        @_substitute match, (err, replacement) =>
          if err
            done err
            return
          matchLength = match[0].length
          if replacement?
            @push hoard.substr 0, match.index
            @push replacement
          else  
            @push hoard.substr 0, match.index + matchLength
          @hoard = hoard.slice match.index + matchLength
          setImmediate =>
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
    if @pattern?
      @hoard = @hoard + String chunk, enc
      @forward @searchLwm, next
    else  
      next null, chunk
    return

  _flush: (next) ->
    @forward 0, next



class VinylReplacer extends stream.Transform

  @SingleClass = SingleReplacer

  constructor: (options) ->
    super objectMode: true
    options = options or {}
    @tagger = options.tagger or (file) -> file.path
    @optioner = options.optioner
    @singleOptions = @createSingleOptions options

  createSingleOptions: (options) ->
    _.pick options, @constructor.SingleClass.optionNames

  createSingleReplacer: (file) ->
    tag = @tagger file
    options = @singleOptions
    if @optioner
      extraOptions = @optioner(file)
      if extraOptions?
        options = _.merge {}, options, extraOptions
    new @constructor.SingleClass tag, options

  _transform: (file, enc, next) ->
    singleReplacer = @createSingleReplacer file
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


