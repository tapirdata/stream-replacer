var vinylFs = require('vinyl-fs');
var streamReplacer = require('stream-replacer');

function asyncDigest(cb) {
  // do some mysterious calculations
  cb('12bf4d');
}

var replacer = streamReplacer({
  pattern: /(src\s*=\s*)(["'])([\w\/-_]*\/)(\w+)(\.\w+)\2/,
  substitute: function(match, tag, cb) {
    asyncDigest (function (digest) {
      cb(match[1] + match[2] + match[3] + match[4] + '-' + digest + match[5] + match[2]);
    });
  }  
});

vinylFs.src(['src/**/*.html'], {buffer: false})
// works with 'buffer: true', too 
  .pipe(replacer)
  .pipe(vinylFs.dest('dist'));

