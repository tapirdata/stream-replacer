var fs = require('fs');
var streamReplacer = require('stream-replacer');

var replacer = streamReplacer({
  single: true,
  pattern: /("license": *")\w+(")/,
  substitute: function(match, tag, done) {
    done(null, match[1] + 'WTFPL' + match[2]);
  }
});

fs.createReadStream('package.json')
  .pipe(replacer)
  .pipe(fs.createWriteStream('new-package.json'));
