
exports.simple =
  pattern: /eels/
  asyncReplace: (match, tag, cb) ->
    cb 'limuli'
    
exports.cap =
  pattern: /[a-zA-Z]+/
  asyncReplace: (match, tag, cb) ->
    original = match[0]
    cb original.charAt(0).toUpperCase() + original.slice(1)

