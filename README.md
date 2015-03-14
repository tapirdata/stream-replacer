# stream-replacer [![Build Status](https://secure.travis-ci.org/tapirdata/stream-replacer.png?branch=master)](https://travis-ci.org/tapirdata/stream-replacer) [![Dependency Status](https://david-dm.org/tapirdata/stream-replacer.svg)](https://david-dm.org/tapirdata/stream-replacer) [![devDependency Status](https://david-dm.org/tapirdata/stream-replacer/dev-status.svg)](https://david-dm.org/tapirdata/stream-replacer#info=devDependencies)
> A transform-stream that performs string replacement on streams.

## Features

Works with vinyl-streams in buffer- and stream-mode.

## Usage

### Single Data Stream

``` js
var fs = require('fs');
var streamReplacer = require('stream-replacer');

var replacer = streamReplacer({
  single: true,
  pattern: /("license": *")\w+(")/,
  substitute: function(match, tag, cb) {
    // always use WTFPL
    cb(match[1] + 'WTFPL' + match[2]);
  }
});

fs.createReadStream('package.json')
  .pipe(replacer)
  .pipe(fs.createWriteStream('new-package.json'));
```

### Vinyl File Stream

``` js
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
      cb(match[1] + match[2] + match[3] + match[4]
        + '-' + digest + match[5] + match[2]);
    });
  }  
});

vinylFs.src(['src/**/*.html'], {buffer: false})
// works with 'buffer: true', too 
  .pipe(replacer)
  .pipe(vinylFs.dest('dist'));
```

## API

#### var replacer = streamReplacer(options);

creates a new replacer. Recognized options are:

- `options.pattern` (required): 
- `options.digestEncoding`: 
- `options.digestLength`: if supplied, the digest length is limited to this length
- `options.single`: if true, create a hasher that transforms a single data-stream; if false (default), create a hasher to transform a vinyl-file-stream. In latter case, the following additional options are recognized:
  - `options.tagger`: a function that generates the *tag* from the processed vinyl-file. Defaults to a function that returns `file.path`.
  - `options.rename`: a function that takes the original file name (without extension) and the calculated digest and should a replacement file name. The strings 'postfix' and 'prefix' can be used, too. They expose some standard replacers.
  - `options.renameFile`: to obtain even finer contol of renaming supply a function that take a viny-file and the digest to directly manipulate the file's path. 
  - `options.maxSingleSize`: In the special case of an stream-file to be renamed, the digest must me emmitted before the file can be passed forward. Then is value is used to set the `highWaterMark` for processing that file to prevent deadlocking. Default is 16MB.


