import fs from 'fs';
import path from 'path';
import assert from 'assert';
import File from 'vinyl';
import vinylFs from 'vinyl-fs';
import vinylTapper from 'vinyl-tapper';
import _ from 'lodash';
import { expect } from 'chai';

import streamReplacer from '../src';
import { Done } from '../src/options';
import repls from './repls';

const fileCount = 2;

export interface MultiTestOptions {
  replName: string;
  useBuffer: boolean;
}

interface TapResult {
  file?: File;
  buffer?: Buffer;
}

function makeTests(title: string, options: MultiTestOptions) {
  describe(title, () => {
    const tapResults: { [key: string]: TapResult } = {};
    const replaceCounts: { [key: string]: number } = {};
    const repl = repls[options.replName];

    before((done: Done) => {
      const replacer = streamReplacer({
        tagger(file) {
          return file.relative;
        },
        pattern: repl.pattern,
        substitute(match: RegExpExecArray, tag: string, done1: Done) {
          const { substitute: realSubstitute } = repl;
          assert(realSubstitute);
          replaceCounts[tag] = (replaceCounts[tag] || 0) + 1;
          return realSubstitute(match, tag, done1);
        },
        optioner: repl.optioner,
      });

      const tapper = vinylTapper({
        provideBuffer: true,
        terminate: true,
      });
      tapper.on('tap', (file: File, buffer: Buffer) => {
        tapResults[file.relative] = {
          file,
          buffer,
        };
      });

      const well = vinylFs.src('fixtures/src/**/*.*', {
        cwd: __dirname,
        buffer: options.useBuffer,
      });
      return well.pipe(replacer).pipe(tapper).on('end', done);
    });

    it('should pass all files', () => expect(_.keys(tapResults)).to.have.length(fileCount));

    it('should pass file types unmodified', () => {
      for (const srcRelative of Object.keys(tapResults)) {
        const { file: destFile } = tapResults[srcRelative];
        assert(destFile);
        expect(destFile.isBuffer()).to.be.equal(options.useBuffer);
      }
    });

    const { expectedCounts } = repl;
    if (expectedCounts != null) {
      it('should find it the correct number of times', () => {
        for (const tag of Object.keys(expectedCounts)) {
          const expectedCount = expectedCounts[tag];
          expect(replaceCounts[tag] || 0).to.be.equal(expectedCount);
        }
      });
    }

    return it('should replace contents in all files', (done: Done) => {
      let restCount = fileCount;
      for (const srcRelative of Object.keys(tapResults)) {
        const { buffer: destBuffer } = tapResults[srcRelative];
        assert(destBuffer);
        const expPath = path.join(__dirname, 'fixtures', repl.expDir, srcRelative);
        fs.readFile(expPath, (err, expBuffer) => {
          expect(destBuffer.length).to.be.equal(expBuffer.length);
          expect(destBuffer.toString('utf8')).to.be.equal(expBuffer.toString('utf8'));
          if (--restCount === 0) {
            done(null);
          }
        });
      }
    });
  });
}

describe('stream-replacer for vinly-stream', function () {
  this.timeout(10000);

  makeTests('with buffer-files, noop', {
    useBuffer: true,
    replName: 'noop',
  });

  makeTests('with stream-files, noop', {
    useBuffer: false,
    replName: 'noop',
  });

  makeTests('with buffer-files, simple replace', {
    useBuffer: true,
    replName: 'simple',
  });

  makeTests('with stream-files, simple replace', {
    useBuffer: false,
    replName: 'simple',
  });

  makeTests('with buffer-files, search only', {
    useBuffer: true,
    replName: 'search',
  });

  makeTests('with stream-files, search only', {
    useBuffer: false,
    replName: 'search',
  });

  makeTests('with buffer-files, simple replace, use optioner', {
    useBuffer: true,
    replName: 'simpleOptioner',
  });

  makeTests('with stream-files, simple replace, use optioner', {
    useBuffer: false,
    replName: 'simpleOptioner',
  });

  makeTests('with buffer-files, search only', {
    useBuffer: true,
    replName: 'search',
  });

  makeTests('with buffer-files, capitalize replace', {
    useBuffer: true,
    replName: 'cap',
  });

  makeTests('with stream-files, capitalize replace', {
    useBuffer: false,
    replName: 'cap',
  });
});
