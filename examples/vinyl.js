var vinylFs = require('vinyl-fs');
var streamReplacer = require('stream-replacer');

function asyncDigest(cb) {
  // do some mysterious calculations
  cb('12bf4d');
}

var replacer = streamReplacer({
  // find some path reference
  pattern: /(src\s*=\s*)(["'])([\w\/-_]*\/)(\w+)(\.\w+)\2/,
  // prepend digest to basename
  substitute: function(match, tag, done) {
    asyncDigest(function (digest) {
      done(null, 
        match[1] + match[2] + match[3] + match[4]
        + '-' + digest + match[5] + match[2]
      );
    });
  }  
});

vinylFs.src(['src/**/*.html'], {buffer: false})
// works with 'buffer: true', too 
  .pipe(replacer)
  .pipe(vinylFs.dest('dist'));

