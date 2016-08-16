import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import vinylTapper from 'vinyl-tapper';
import { expect } from 'chai';
import streamReplacer from '../src';
import * as repls from './repls';


function makeTests(title, options) {

  describe(title, function() {

    const repl = repls[options.replName];
    const srcPath = path.join(__dirname, 'fixtures/src', options.srcName);
    const expPath = path.join(__dirname, 'fixtures', repl.expDir, options.srcName);

    let digest = null;
    let destBuffer = null;
    let replaceError = null;

    before(function(done) {
      try {
        var replacer = streamReplacer({
          single: true,
          pattern: repl.pattern,
          substitute: repl.substitute
        });
      } catch (err) {
        replaceError = err;
        done();
        return;
      }
      const tapper = vinylTapper({
        single: true,
        terminate: true,
        provideBuffer: true
      });
      tapper.on('tap', buffer => destBuffer = buffer
      );

      fs.createReadStream(srcPath)
      .pipe(replacer)
      .on('error', function(err) { 
        replaceError = err;
        done();
      }
      )
      .pipe(tapper)
      .on('end', done);
    });

    if (repl.fails) {
      it('should fail', () => expect(replaceError).to.be.an.instanceOf(repl.fails)
      ); 
    } else {  
      it('should replace contents', done =>
        fs.readFile(expPath, function(err, expBuffer) {
          expect(destBuffer.length).to.be.equal(expBuffer.length);
          expect(destBuffer.toString('utf8')).to.be.equal(expBuffer.toString('utf8'));
          done();
        }
        )
      
      );
    }
  }
  )
}

     
describe('stream-replacer for single stream', function() {

  this.timeout(10000);

  makeTests('with bad pattern', {
    srcName: 'eels.txt',
    replName: 'badPattern'
  }
  );

  makeTests('with bad substitute', {
    srcName: 'eels.txt',
    replName: 'badSubstitute'
  }
  );

  makeTests('with short file, search only', {
    srcName: 'eels.txt',
    replName: 'search'
  }
  );

  makeTests('with short file, search sync only', {
    srcName: 'eels.txt',
    replName: 'searchSync'
  }
  );

  makeTests('with long file, search only', {
    srcName: 'lorem.txt',
    replName: 'search'
  }
  );

  makeTests('with short file, simple replace', {
    srcName: 'eels.txt',
    replName: 'simple'
  }
  );

  makeTests('with long file, simple replace', {
    srcName: 'lorem.txt',
    replName: 'simple'
  }
  );

  makeTests('with short file, simple sync replace', {
    srcName: 'eels.txt',
    replName: 'simpleSync'
  }
  );

  makeTests('with short file, simple promise replace', {
    srcName: 'eels.txt',
    replName: 'simplePromise'
  }
  );

  makeTests('with short file, throw on substitute', {
    srcName: 'eels.txt',
    replName: 'failSubstitute'
  }
  );

  makeTests('with short file, capitalize replace', {
    srcName: 'eels.txt',
    replName: 'cap'
  }
  );

  return makeTests('with long file, capitalize replace', {
    srcName: 'lorem.txt',
    replName: 'cap'
  }
  );
}
);


