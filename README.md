# stream-replacer [![Build Status](https://secure.travis-ci.org/tapirdata/stream-replacer.png?branch=master)](https://travis-ci.org/tapirdata/stream-replacer) [![Dependency Status](https://david-dm.org/tapirdata/stream-replacer.svg)](https://david-dm.org/tapirdata/stream-replacer) [![devDependency Status](https://david-dm.org/tapirdata/stream-replacer/dev-status.svg)](https://david-dm.org/tapirdata/stream-replacer#info=devDependencies)
> A transform-stream that performs regex search % replace on streams.

## Features

Works with vinyl-streams in buffer- and stream-mode. Supports async replacement creation.

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

- `options.pattern` (required): a `RegExp`, the pattern to search for
- `options.substitute` (required): a `function (match, tag, cb)` that returns the replacement string asynchronously. It takes:
  - `match`: the match-object, created by `RegExp#exec`
  - `tag`: a *tag*, created by `tagger` (see below)
  - `cb`: the callback that returns the replacement string. Call `cb()` to skip replacement.
- `options.searchLwm`: the search low-water-mark. This is the minimum window size that the search operates on in stream-mode (except on the end of the stream). Set this twice your maximum expected match-length to prevent search misses. (default: 1024)
- `options.single`: if true, create a raplacer that works on a single data-stream; if false (default), create a replacer that works on a vinyl-file-stream. In latter case, the following additional options are recognized:
  - `options.tagger`: a function that generates the *tag* from the processed vinyl-file. Defaults to a function that returns `file.path`.

