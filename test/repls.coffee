Promise = require 'bluebird'

exports.badPattern =
  pattern: 'eels'
  substitute: (match, tag, done) ->
    done new Error 'bad'
  expDir: 'exp-simple'  
  fails: Error

exports.badSubstitute =
  pattern: /eels/
  substitute: 'limuli'
  expDir: 'exp-simple'  
  fails: Error

exports.noop =
  expectedCounts:
    'eels.txt': 0
    'lorem.txt': 0
  expDir: 'src'  

exports.search =
  pattern: /\w+/
  substitute: (match, tag, done) ->
    done()
  expectedCounts:
    'eels.txt': 6
    'lorem.txt': 47088
  expDir: 'src'  

exports.searchSync =
  pattern: /\w+/
  substitute: ->
    null
  expectedCounts:
    'eels.txt': 6
    'lorem.txt': 47088
  expDir: 'src'  
    
exports.simple =
  pattern: /eels/
  substitute: (match, tag, done) ->
    done null, 'limuli'
  expDir: 'exp-simple'  

exports.simpleSync =
  pattern: /eels/
  substitute: ->
    'limuli'
  expDir: 'exp-simple'  

exports.simplePromise =
  pattern: /eels/
  substitute: ->
    Promise.resolve 'limuli'
  expDir: 'exp-simple'  

exports.simpleOptioner =
  pattern: 'invalid'
  optioner: (file) ->
    pattern: /eels/
    substitute: (match, tag, done) ->
      done null, 'limuli'
  expDir: 'exp-simple'  

exports.failSubstitute =
  pattern: /eels/
  substitute: (match, tag, done) ->
    done new Error 'bad'
  expDir: 'exp-simple'  
  fails: Error
    
exports.cap =
  pattern: /[a-zA-Z]+/
  substitute: (match, tag, done) ->
    original = match[0]
    replacement = original.charAt(0).toUpperCase() + original.slice(1)
    done null, replacement
  expDir: 'exp-cap'  

