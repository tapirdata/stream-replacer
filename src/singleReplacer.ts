import stream = require("stream")
import assert = require("assert")

import { Cb, ReplacerOptions, Substitute } from "./options"

export class SingleReplacer extends stream.Transform {

  protected tag: string
  protected pattern?: RegExp
  protected substitute?: Substitute
  protected searchLwm: number
  protected hoard: string

  constructor(tag: string | ReplacerOptions, options?: ReplacerOptions) {
    super(options)
    if (typeof tag === "object") {
      options = tag as ReplacerOptions
      tag = options.tag as string
    } else {
      options = options || {}
    }
    this.tag = tag as string
    if (options.pattern != null) {
      assert(options.pattern instanceof RegExp, "pattern must be a RegExp")
      assert(typeof options.substitute === "function", "substitute must be a function")
    }
    this.pattern = options.pattern
    this.substitute = options.substitute
    this.searchLwm = options.searchLwm || 1024
    this.hoard = ""
  }

  public _transform(chunk: Buffer, enc: string, next: Cb) {
    if (this.pattern != null) {
      this.hoard = this.hoard + String(chunk)
      this.forward(this.searchLwm, next)
    } else {
      next(null, chunk)
    }
  }

  protected _substitute(match: RegExp, done: Cb) {
    let result: any
    result = (this.substitute as Substitute)(match, this.tag, (err: any, replacement: any) => {
      if (result !== undefined) {
        done(new Error("callback used after sync return"))
      } else {
        done(err, replacement)
      }
    })
    if (typeof result === "string" || result === null) {
      done(null, result)
      return
    }
    if (typeof result === "object" && typeof result.then === "function") {
      result.then(
        (replacement: any) => done(null, replacement),
        (err: any) => done(err),
      )
    }
  }

  protected forward(lwm: number, done: Cb) {
    const { hoard } = this
    if (hoard.length > lwm) {
      const match: any = (this.pattern as RegExp).exec(hoard)
      if (match != null) {
        this._substitute(match, (err, replacement) => {
          if (err) {
            done(err)
            return
          }
          const matchLength = match[0].length
          if (replacement != null) {
            this.push(hoard.substr(0, match.index))
            this.push(replacement)
          } else {
            this.push(hoard.substr(0, match.index + matchLength))
          }
          this.hoard = hoard.slice(match.index + matchLength)
          setImmediate(() => {
            return this.forward(lwm, done)
          })
        })
        return
      }
      // no match
      const fwdIndex = hoard.length - lwm
      this.push(hoard.slice(0, fwdIndex))
      this.hoard = hoard.slice(fwdIndex)
    }
    done()
  }

  protected _flush(next: Cb) {
    return this.forward(0, next)
  }
}

(SingleReplacer as any).optionNames = ["pattern", "substitute"]
