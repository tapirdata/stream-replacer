import * as File from 'vinyl';
import { Done, Optioner, ReplacerOptions, Substitute, SubstituteResult } from '../src/options';

export interface Repl {
  pattern?: RegExp;
  substitute?: Substitute;
  optioner?: Optioner;
  expDir: string;
  expectedCounts?: Record<string, number>;
  fails?: new () => Error;
}

const badPattern = {
  pattern: 'eels' as unknown as RegExp,
  substitute(match: unknown, tag: string, done: Done): SubstituteResult {
    done(new Error('bad'));
    return null;
  },
  expDir: 'exp-simple',
  fails: Error,
};

const badSubstitute = {
  pattern: /eels/,
  substitute: 'limuli' as unknown as Substitute,
  expDir: 'exp-simple',
  fails: Error,
};

const noop = {
  expectedCounts: {
    'eels.txt': 0,
    'lorem.txt': 0,
  },
  expDir: 'src',
};

const search = {
  pattern: /\w+/,
  substitute(match: unknown, tag: string, done: Done): SubstituteResult {
    done(null);
    return;
  },
  expectedCounts: {
    'eels.txt': 6,
    'lorem.txt': 47088,
  },
  expDir: 'src',
};

const searchSync = {
  pattern: /\w+/,
  substitute(): SubstituteResult {
    return null;
  },
  expectedCounts: {
    'eels.txt': 6,
    'lorem.txt': 47088,
  },
  expDir: 'src',
};

const simple = {
  pattern: /eels/,
  substitute(match: unknown, tag: string, done: Done): SubstituteResult {
    done(null, 'limuli');
    return;
  },
  expDir: 'exp-simple',
};

const simpleSync = {
  pattern: /eels/,
  substitute(): SubstituteResult {
    return 'limuli';
  },
  expDir: 'exp-simple',
};

const simplePromise = {
  pattern: /eels/,
  substitute(): SubstituteResult {
    return Promise.resolve('limuli');
  },
  expDir: 'exp-simple',
};

const simpleOptioner = {
  pattern: 'invalid' as unknown as RegExp,
  optioner(_file: File): ReplacerOptions {
    return {
      pattern: /eels/,
      substitute(match: unknown, tag: string, done: Done): SubstituteResult {
        done(null, 'limuli');
        return;
      },
    };
  },
  expDir: 'exp-simple',
};

const failSubstitute = {
  pattern: /eels/,
  substitute(match: unknown, tag: string, done: Done): SubstituteResult {
    done(new Error('bad'));
    return null;
  },
  expDir: 'exp-simple',
  fails: Error,
};

const cap = {
  pattern: /[a-zA-Z]+/,
  substitute(match: RegExpMatchArray, tag: string, done: Done): SubstituteResult {
    const original = match[0];
    const replacement = original.charAt(0).toUpperCase() + original.slice(1);
    done(null, replacement);
    return;
  },
  expDir: 'exp-cap',
};

const repls: Record<string, Repl> = {
  noop,
  badPattern,
  badSubstitute,
  search,
  searchSync,
  simple,
  simpleSync,
  simplePromise,
  simpleOptioner,
  failSubstitute,
  cap,
};
export default repls;
