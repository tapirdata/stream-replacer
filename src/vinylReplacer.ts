import { Transform, TransformCallback } from 'stream';
import BufferListStream from 'bl';
import File from 'vinyl';
import _ from 'lodash';

import { Optioner, ReplacerOptions, Tagger } from './options';
import { SingleReplacer, SingleReplacerClass } from './singleReplacer';

export class VinylReplacer extends Transform {
  protected tagger: Tagger;
  protected optioner?: Optioner;
  protected singleOptions: ReplacerOptions;

  getSingleClass(): SingleReplacerClass {
    return SingleReplacer;
  }

  constructor(options: ReplacerOptions) {
    super({ objectMode: true });
    options = options || {};
    this.tagger = options.tagger || ((file) => file.path);
    this.optioner = options.optioner;
    this.singleOptions = this.createSingleOptions(options);
  }

  public _transform(file: File, _enc: BufferEncoding, next: TransformCallback): void {
    const singleReplacer = this.createSingleReplacer(file);
    if (file.isStream()) {
      file.contents = file.contents.pipe(singleReplacer);
      next(null, file);
    } else {
      singleReplacer.end(file.contents, undefined);
      const bl = new BufferListStream((err: Error | null, buffer: Buffer) => {
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
  protected createSingleOptions(options: ReplacerOptions): ReplacerOptions {
    const SingleClass = this.getSingleClass();
    return _.pick(options, SingleClass.optionNames);
  }

  protected createSingleReplacer(file: File): SingleReplacer {
    const tag = this.tagger(file);
    let options = this.singleOptions;
    if (this.optioner) {
      const extraOptions = this.optioner(file);
      if (extraOptions != null) {
        options = _.merge({}, options, extraOptions);
      }
    }
    const SingleClass = this.getSingleClass();
    return new SingleClass(tag, options);
  }
}
