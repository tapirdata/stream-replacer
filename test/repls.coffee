
exports.search =
  pattern: /\w+/
  substitute: (match, tag, cb) ->
    cb()
  expectedCounts:
    'eels.txt': 6
    'lorem.txt': 47088
    
exports.simple =
  pattern: /eels/
  substitute: (match, tag, cb) ->
    cb 'limuli'
    
exports.cap =
  pattern: /[a-zA-Z]+/
  substitute: (match, tag, cb) ->
    original = match[0]
    replacement = original.charAt(0).toUpperCase() + original.slice(1)
    cb replacement

