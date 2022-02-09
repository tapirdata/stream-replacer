import { TransformOptions } from 'stream';
import File from 'vinyl';

export type Done = (err: Error | null, val?: unknown) => void;
export type Tagger = (file: File) => string;
export type SubstituteResult = undefined | null | string | Promise<string | null>;
export type Substitute = (match: RegExpExecArray, tag: string, done: Done) => SubstituteResult;
export type Optioner = (file: File) => ReplacerOptions;

export interface ReplacerOptions extends TransformOptions {
  tag?: string;
  pattern?: RegExp;
  substitute?: Substitute;
  searchLwm?: number;
  tagger?: Tagger;
  optioner?: Optioner;
  single?: boolean;
}
