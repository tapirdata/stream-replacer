# stream-replacer

[![npm version](https://img.shields.io/npm/v/stream-replacer.svg?style=flat-square)](https://www.npmjs.com/package/stream-replacer)
[![Build Status](https://secure.travis-ci.org/tapirdata/stream-replacer.png?branch=master)](https://travis-ci.org/tapirdata/stream-replacer)
[![Dependency Status](https://david-dm.org/tapirdata/stream-replacer.svg)](https://david-dm.org/tapirdata/stream-replacer)
[![devDependency Status](https://david-dm.org/tapirdata/stream-replacer/dev-status.svg)](https://david-dm.org/tapirdata/stream-replacer#info=devDependencies)

> A transform-stream that performs regexp search & replace on streams.

## Features

Works with vinyl-streams in buffer- and stream-mode. Supports asynchronous replacement creation.

## Usage

### Single Data Stream

``` js
import fs from 'fs';
import streamReplacer from 'stream-replacer';

const replacer = streamReplacer({
  single: true,
  pattern: /("license": *")\w+(")/,
  substitute: function(match, tag, done) {
    // always use WTFPL
    done(null, match[1] + 'WTFPL' + match[2]);
  }
});

fs.createReadStream('package.json')
  .pipe(replacer)
  .pipe(fs.createWriteStream('new-package.json'));
```

### Vinyl File Stream

``` js
import vinylFs from 'vinyl-fs';
import streamReplacer from 'stream-replacer';

function asyncDigest(cb) {
  // do some mysterious calculations
  cb('12bf4d');
}

const replacer = streamReplacer({
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

```

## API

#### const replacer = streamReplacer(options);

Creates a new replacer. Recognized options are:

- `pattern` (`RegExp`): the pattern to search for.
- `substitute` (`function (match, tag, done)`, required if `pattern` is specified): a function that returns the replacement string asynchronously. It takes:
  - `match`: the match-object, created by `RegExp#exec`.
  - `tag`: a **tag**, created by `tagger` (see below)
  - `done`: the callback to return error and replacement string: `done(null, replacement)`. Call `done()` to skip replacement.
  Alternatively `substitute` may just return a replacement string synchronously (or `null` to skip) or a promise that resolves to a string or to `null`.
- `searchLwm` (number, default: 1024): the search low-water-mark. This is the minimum window size that the search operates on in stream-mode (except on the end of the stream). Set this twice your maximum expected match-length to prevent search misses.
- `single` (boolean, default: `false`): If true, create a replacer that works on a single data-stream. If false, create a replacer that works on a vinyl-file-stream. In latter case, the following additional options are recognized:
  - `tagger` (`function(file)`): a function that generates the **tag** from the processed vinyl-file. Defaults to a function that returns `file.path`.
  - `optioner`(`function(file)`): a function that returns an object to overwrite options per vinyl-file.

