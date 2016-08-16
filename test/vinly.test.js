import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import vinylFs from 'vinyl-fs';
import vinylTapper from 'vinyl-tapper';
import { expect } from 'chai';
import streamReplacer from '../src';
import * as repls from './repls';

const fileCount = 2;

function makeTests(title, options) {

  describe(title, function() {

    let tapResults = {};
    let replaceCounts = {};
    let repl = repls[options.replName];

    before(function(done) {

      let replacer = streamReplacer({
        tagger(file) { return file.relative; },
        pattern: repl.pattern,
        substitute(match, tag, done) {
          replaceCounts[tag] = (replaceCounts[tag] || 0) + 1;
          return repl.substitute(match, tag, done);
        },
        optioner: repl.optioner
      });

      let tapper = vinylTapper({
        provideBuffer: true,
        terminate: true
      });
      tapper.on('tap', (file, buffer) =>
        tapResults[file.relative] = { 
          file,
          buffer
        }
      
      );


      let well = vinylFs.src('fixtures/src/**/*.*', {
        cwd: __dirname,
        buffer: options.useBuffer
      }
      );
      return well
        .pipe(replacer)
        .pipe(tapper)
        .on('end', done);
    });

    it('should pass all files', () => expect(_.keys(tapResults)).to.have.length(fileCount)
    );

    it('should pass file types unmodified', function() {
      for (let srcRelative of Object.keys(tapResults)) {
        let {file: destFile, buffer: destBuffer} = tapResults[srcRelative];
        expect(destFile.isBuffer()).to.be.equal(options.useBuffer);
      }
    }
    );  

    if (repl.expectedCounts) {
      it('should find it the correct number of times', function() {
        for (let tag of Object.keys(repl.expectedCounts)) {
          let expectedCount = repl.expectedCounts[tag];
          expect(replaceCounts[tag] || 0).to.be.equal(expectedCount);
        }
      }
      );
    }


    return it('should replace contents in all files', function(done) {
      let restCount = fileCount;
      for (let srcRelative of Object.keys(tapResults)) {
        let {file: destFile, buffer: destBuffer} = tapResults[srcRelative];
        let expPath = path.join(__dirname, 'fixtures', repl.expDir, srcRelative);
        fs.readFile(expPath, function(err, expBuffer) {
          expect(destBuffer.length).to.be.equal(expBuffer.length);
          expect(destBuffer.toString('utf8')).to.be.equal(expBuffer.toString('utf8'));
          if (--restCount === 0) {
            done();
          }
        });
      }
    }
    );
  }
  )      
}


describe('stream-replacer for vinly-stream', function() {

  this.timeout(10000);

  makeTests('with buffer-files, noop', {
    useBuffer: true,
    replName: 'noop'
  }
  );

  makeTests('with stream-files, noop', {
    useBuffer: false,
    replName: 'noop'
  }
  );

  makeTests('with buffer-files, simple replace', {
    useBuffer: true,
    replName: 'simple'
  }
  );

  makeTests('with stream-files, simple replace', {
    useBuffer: false,
    replName: 'simple'
  }
  );

  makeTests('with buffer-files, search only', {
    useBuffer: true,
    replName: 'search'
  }
  );

  makeTests('with stream-files, search only', {
    useBuffer: false,
    replName: 'search'
  }
  );

  makeTests('with buffer-files, simple replace, use optioner', {
    useBuffer: true,
    replName: 'simpleOptioner'
  }
  );

  makeTests('with stream-files, simple replace, use optioner', {
    useBuffer: false,
    replName: 'simpleOptioner'
  }
  );

  makeTests('with buffer-files, search only', {
    useBuffer: true,
    replName: 'search'
  }
  );

  makeTests('with buffer-files, capitalize replace', {
    useBuffer: true,
    replName: 'cap'
  }
  );

  makeTests('with stream-files, capitalize replace', {
    useBuffer: false,
    replName: 'cap'
  }
  );
}
);

