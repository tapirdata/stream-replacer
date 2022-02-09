import assert from 'assert';
import { Transform, TransformCallback } from 'stream';

import { ReplacerOptions, Substitute, SubstituteResult } from './options';

export class SingleReplacer extends Transform {
  protected tag: string;
  protected pattern?: RegExp;
  protected substitute?: Substitute;
  protected searchLwm: number;
  protected hoard: string;

  constructor(tag: string | ReplacerOptions, options?: ReplacerOptions) {
    super(options);
    if (typeof tag === 'object') {
      options = tag;
      tag = options.tag as string;
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

  public _transform(chunk: Buffer, enc: string, next: TransformCallback): void {
    if (this.pattern != null) {
      this.hoard = this.hoard + String(chunk);
      this.forward(this.searchLwm, next);
    } else {
      next(null, chunk);
    }
  }

  protected _substitute(match: RegExpExecArray, next: TransformCallback): void {
    const { substitute } = this;
    if (substitute == null) {
      return;
    }
    let result: SubstituteResult | undefined = undefined;
    result = substitute(match, this.tag, (err: Error | null, replacement: unknown) => {
      /*
        console.log(
          "_substutute cb: err=",
          err,
          "replacement=",
          replacement,
          "match=",
          match
        );
        */
      if (result !== undefined) {
        next(new Error('callback used after sync return'));
      } else {
        next(err, replacement);
      }
    });
    // console.log("_substutute result=", result);
    if (typeof result === 'string' || result === null) {
      next(null, result);
      return;
    } else if (result) {
      result.then(
        (replacement: string | null) => next(null, replacement),
        (err: Error) => next(err),
      );
    }
  }

  ____push(chunk: unknown): boolean {
    console.log('push: chunk=', chunk);
    return super.push(chunk);
  }

  protected forward(lwm: number, next: TransformCallback): void {
    const { hoard } = this;
    if (hoard.length > lwm) {
      const { pattern } = this;
      const match = pattern && pattern.exec(hoard);
      if (match != null) {
        this._substitute(match, (err, replacement) => {
          // console.log("forward cb: err=", err, "replacement=", replacement);
          if (err) {
            next(err);
            return;
          }
          const matchLength = match[0].length;
          // console.log("forward cb: matchLength=", matchLength, "hoard=", hoard);
          if (replacement != null) {
            this.push(hoard.substr(0, match.index));
            this.push(replacement);
          } else {
            this.push(hoard.substr(0, match.index + matchLength));
          }
          this.hoard = hoard.slice(match.index + matchLength);
          setImmediate(() => {
            return this.forward(lwm, next);
          });
        });
        return;
      }
      // no match
      const fwdIndex = hoard.length - lwm;
      this.push(hoard.slice(0, fwdIndex));
      this.hoard = hoard.slice(fwdIndex);
    }
    next(null);
  }

  _flush(next: TransformCallback): void {
    return this.forward(0, next);
  }

  static optionNames = ['pattern', 'substitute'];
}

export interface SingleReplacerClass {
  new (tag: string | ReplacerOptions, options: ReplacerOptions): SingleReplacer;
  optionNames: string[];
}
