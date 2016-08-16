
export let badPattern = {
  pattern: 'eels',
  substitute(match, tag, done) {
    return done(new Error('bad'));
  },
  expDir: 'exp-simple',  
  fails: Error
};

export let badSubstitute = {
  pattern: /eels/,
  substitute: 'limuli',
  expDir: 'exp-simple',  
  fails: Error
};

export let noop = {
  expectedCounts: {
    'eels.txt': 0,
    'lorem.txt': 0
  },
  expDir: 'src'  
};

export let search = {
  pattern: /\w+/,
  substitute(match, tag, done) {
    return done();
  },
  expectedCounts: {
    'eels.txt': 6,
    'lorem.txt': 47088
  },
  expDir: 'src'  
};

export let searchSync = {
  pattern: /\w+/,
  substitute() {
    return null;
  },
  expectedCounts: {
    'eels.txt': 6,
    'lorem.txt': 47088
  },
  expDir: 'src'  
};
    
export let simple = {
  pattern: /eels/,
  substitute(match, tag, done) {
    return done(null, 'limuli');
  },
  expDir: 'exp-simple'  
};

export let simpleSync = {
  pattern: /eels/,
  substitute() {
    return 'limuli';
  },
  expDir: 'exp-simple'  
};

export let simplePromise = {
  pattern: /eels/,
  substitute() {
    return Promise.resolve('limuli');
  },
  expDir: 'exp-simple'  
};

export let simpleOptioner = {
  pattern: 'invalid',
  optioner(file) {
    return {
      pattern: /eels/,
      substitute(match, tag, done) {
        return done(null, 'limuli');
      }
    };
  },
  expDir: 'exp-simple'  
};

export let failSubstitute = {
  pattern: /eels/,
  substitute(match, tag, done) {
    return done(new Error('bad'));
  },
  expDir: 'exp-simple',  
  fails: Error
};
    
export let cap = {
  pattern: /[a-zA-Z]+/,
  substitute(match, tag, done) {
    let original = match[0];
    let replacement = original.charAt(0).toUpperCase() + original.slice(1);
    return done(null, replacement);
  },
  expDir: 'exp-cap'  
};

