import BufferList = require( "bl")
import _ = require( "lodash")
import stream = require("stream")
import File = require("vinyl")

import { Cb, ReplacerOptions, Tagger } from "./options"
import { SingleReplacer } from "./singleReplacer"

export class VinylReplacer extends stream.Transform {

  protected tagger: Tagger
  protected optioner?: (file: File) => any
  protected singleOptions: ReplacerOptions

  constructor(options: ReplacerOptions) {
    super({objectMode: true})
    options = options || {}
    this.tagger = options.tagger || ((file) => file.path)
    this.optioner = options.optioner
    this.singleOptions = this.createSingleOptions(options)
  }

  public _transform(file: File, enc: string, next: Cb) {
    const singleReplacer = this.createSingleReplacer(file)
    if (file.isStream()) {
      file.contents = file.contents.pipe(singleReplacer)
      next(null, file)
    } else {
      singleReplacer.end(file.contents, null)
      const bl = new BufferList((err: any, buffer: Buffer) => {
        if (err) {
          next(err)
          return
        }
        file.contents = buffer
        next(null, file)
      })
      singleReplacer.pipe(bl)
    }
  }
  protected createSingleOptions(options: ReplacerOptions) {
    return _.pick(options, (this.constructor as any).SingleClass.optionNames)
  }

  protected createSingleReplacer(file: File) {
    const tag = this.tagger(file)
    let options = this.singleOptions
    if (this.optioner) {
      const extraOptions = this.optioner(file)
      if (extraOptions != null) {
        options = _.merge({}, options, extraOptions)
      }
    }
    return new (this.constructor as any).SingleClass(tag, options)
  }

}

(VinylReplacer as any).SingleClass = SingleReplacer
