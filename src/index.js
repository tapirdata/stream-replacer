import assert from 'assert';
import path from 'path';
import events from 'events';
import stream from 'readable-stream';
import BufferList from 'bl';
import _ from 'lodash';

class SingleReplacer extends stream.Transform {

  constructor(tag, options) {
    super(options);
    if (typeof tag === 'object') {
      options = tag;
      ({ tag } = options);
    } else {    
      options = options || {};
    }
    this.tag = tag;
    if (options.pattern != null) {
      assert(options.pattern instanceof RegExp, 'pattern must be a RegExp');
      assert(typeof options.substitute === 'function', 'substitute must be a function');
    }
    this.pattern = options.pattern;
    this.substitute = options.substitute;
    this.searchLwm = options.searchLwm || 1024;
    this.hoard = '';
  }

  _substitute(match, done) {
    let result = this.substitute(match, this.tag, function(err, replacement) {
      if (result !== undefined) {
        done(new Error('callback used after sync return'));
      } else {   
        done(err, replacement);
      }
    }
    );
    if (typeof result === 'string' || result === null) {
      done(null, result);
      return;
    }
    if (typeof result === 'object' && typeof result.then === 'function') {
      result.then(
        replacement => done(null, replacement),
        err => done(err)
      );  
    }  
  }

  forward(lwm, done) {
    let { hoard } = this;
    // console.log 'SingleReplacer#forward: hoard.length=%d hoard=%s...', hoard.length, hoard.slice 0, 32
    if (hoard.length > lwm) {
      let match = this.pattern.exec(hoard);
      if (match) {
        //console.log 'SingleReplacer#forward: match[0]=%s match.index=%d', match[0], match.index
        this._substitute(match, (err, replacement) => {
          if (err) {
            done(err);
            return;
          }
          let matchLength = match[0].length;
          if (replacement != null) {
            this.push(hoard.substr(0, match.index));
            this.push(replacement);
          } else {  
            this.push(hoard.substr(0, match.index + matchLength));
          }
          this.hoard = hoard.slice(match.index + matchLength);
          setImmediate(() => {
            return this.forward(lwm, done);
          }
          );
        }
        );
        return;
      }
      // no match
      let fwdIndex = hoard.length - lwm;
      this.push(hoard.slice(0, fwdIndex));
      this.hoard = hoard.slice(fwdIndex);
    }
    done();  
  }

  _transform(chunk, enc, next) {
    if (this.pattern != null) {
      this.hoard = this.hoard + String(chunk, enc);
      this.forward(this.searchLwm, next);
    } else {  
      next(null, chunk);
    }
  }

  _flush(next) {
    return this.forward(0, next);
  }
}


SingleReplacer.optionNames = ['pattern', 'substitute'];



class VinylReplacer extends stream.Transform {

  constructor(options) {
    super({objectMode: true});
    options = options || {};
    this.tagger = options.tagger || (file => file.path);
    this.optioner = options.optioner;
    this.singleOptions = this.createSingleOptions(options);
  }

  createSingleOptions(options) {
    return _.pick(options, this.constructor.SingleClass.optionNames);
  }

  createSingleReplacer(file) {
    let tag = this.tagger(file);
    let options = this.singleOptions;
    if (this.optioner) {
      let extraOptions = this.optioner(file);
      if (extraOptions != null) {
        options = _.merge({}, options, extraOptions);
      }
    }
    return new this.constructor.SingleClass(tag, options);
  }

  _transform(file, enc, next) {
    let singleReplacer = this.createSingleReplacer(file);
    if (file.isStream()) {
      file.contents = file.contents.pipe(singleReplacer);
      next(null, file);
    } else {
      singleReplacer.end(file.contents, null);
      let bl = new BufferList(function(err, buffer) {
        if (err) {
          next(err);
          return;
        }
        file.contents = buffer;
        next(null, file);
      });
      singleReplacer.pipe(bl);
    }  
  }
}

VinylReplacer.SingleClass = SingleReplacer;


let factory = function(options) {
  if (options && options.single) {
    return new SingleReplacer(options);
  } else {  
    return new VinylReplacer(options);
  }
};

factory.SingleReplacer = SingleReplacer;
factory.VinylReplacer = VinylReplacer;
export default factory;


