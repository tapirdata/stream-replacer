import stream = require("stream")
import File = require("vinyl")

export type Cb = (err?: any, val?: any) => void
export type Tagger = (file: File) => string
export type Substitute= (match: any, tag: string, cb: Cb) => string

export interface ReplacerOptions extends stream.TransformOptions {
  tag?: string
  pattern?: RegExp
  substitute?: Substitute
  searchLwm?: number
  tagger?: Tagger
  optioner?: (file: File) => any
  single?: boolean
}
