'use strict';

// Run against the COMPILED output, not the sources: `dist` is what consumers load,
// and the published `files` field ships nothing else. Uses node:test, so the package
// keeps its single runtime dependency.
const test = require('node:test');
const assert = require('node:assert');

const {
  numberValidation,
  portValidation,
  stringValidation,
  hostValidation,
  uriValidation,
  oneOfArrayValidation,
  durationValidation,
  optionalStringValidation,
  booleanValidation,
} = require('../dist/index.js');

const KEY = 'NODE_ENV_VALIDATOR_TEST_KEY';

/** Set (or unset, with `undefined`) the probe key for one call, then restore it. */
const withEnv = (value, run) => {
  const previous = process.env[KEY];
  if (value === undefined) {
    delete process.env[KEY];
  } else {
    process.env[KEY] = value;
  }
  try {
    return run();
  } finally {
    if (previous === undefined) {
      delete process.env[KEY];
    } else {
      process.env[KEY] = previous;
    }
  }
};

test('numberValidation: required form accepts a finite number', () => {
  assert.strictEqual(
    withEnv('30', () => numberValidation(KEY)),
    30,
  );
  assert.strictEqual(
    withEnv('0', () => numberValidation(KEY)),
    0,
  );
  assert.strictEqual(
    withEnv('-1.5', () => numberValidation(KEY)),
    -1.5,
  );
  assert.strictEqual(
    withEnv('1e3', () => numberValidation(KEY)),
    1000,
  );
});

test('numberValidation: required form throws when the key is unset', () => {
  assert.throws(
    () => withEnv(undefined, () => numberValidation(KEY)),
    /should be a finite number/,
  );
});

test('numberValidation: default form returns the default when the key is unset', () => {
  assert.strictEqual(
    withEnv(undefined, () => numberValidation(KEY, 30)),
    30,
  );
});

test('numberValidation: default form still accepts an explicit value', () => {
  assert.strictEqual(
    withEnv('5', () => numberValidation(KEY, 30)),
    5,
  );
});

test('numberValidation: default form THROWS on a set-but-invalid value', () => {
  // The asymmetry this validator exists for: unset takes the default, garbage does not.
  // An operator who writes `trente` meant a number and must hear about it, rather than
  // silently getting 30 and spending a quota they tried to cap.
  for (const bad of ['trente', '', 'NaN', 'Infinity', '-Infinity', '12abc']) {
    assert.throws(
      () => withEnv(bad, () => numberValidation(KEY, 30)),
      /should be a finite number/,
      `expected ${JSON.stringify(bad)} to be rejected`,
    );
  }
});

test('numberValidation: a zero default is honoured, not treated as absent', () => {
  // `defaultValue === undefined` is the required/optional switch, so 0 must stay optional.
  assert.strictEqual(
    withEnv(undefined, () => numberValidation(KEY, 0)),
    0,
  );
});

test('error messages name the key without a stray quote', () => {
  // Until 0.1.0 every message read `process.env.'KEY should be ...`.
  assert.throws(
    () => withEnv(undefined, () => stringValidation(KEY)),
    (error) => error.message === `process.env.${KEY} should be a string`,
  );
});

test('the other validators still behave', () => {
  assert.strictEqual(
    withEnv('8080', () => portValidation(KEY)),
    8080,
  );
  assert.throws(() => withEnv('not-a-port', () => portValidation(KEY)), /should be a port/);

  assert.strictEqual(
    withEnv('hello', () => stringValidation(KEY)),
    'hello',
  );

  assert.strictEqual(
    withEnv('example.com', () => hostValidation(KEY)),
    'example.com',
  );
  assert.throws(() => withEnv('not a host', () => hostValidation(KEY)), /should be an host/);

  assert.strictEqual(
    withEnv('https://example.com', () => uriValidation(KEY)),
    'https://example.com',
  );
  assert.throws(() => withEnv('HELLO', () => uriValidation(KEY)), /should be an uri/);

  assert.strictEqual(
    withEnv('b', () => oneOfArrayValidation(KEY, ['a', 'b'])),
    'b',
  );
  assert.throws(
    () => withEnv('c', () => oneOfArrayValidation(KEY, ['a', 'b'])),
    /should be one of the input array/,
  );
});

test('durationValidation: accepts the three units', () => {
  for (const [raw, expected] of [
    ['30s', '30s'],
    ['15m', '15m'],
    ['2h', '2h'],
    ['1.5h', '1.5h'],
  ]) {
    assert.strictEqual(
      withEnv(raw, () => durationValidation(KEY)),
      expected,
    );
  }
});

test('durationValidation: rejects what the hand-rolled cast let through', () => {
  // Twelve configs wrote `return value as RateLimitWindow`, which checks nothing at runtime.
  // Every one of these reached the rate limiter as a "valid" window.
  for (const bad of ['30x', 'abc', '30', 's', '30 s', '', '30sm', '-5s']) {
    assert.throws(
      () => withEnv(bad, () => durationValidation(KEY)),
      /should be a duration/,
      `expected ${JSON.stringify(bad)} to be rejected`,
    );
  }
});

test('durationValidation: default form takes the default when unset, throws when garbage', () => {
  assert.strictEqual(
    withEnv(undefined, () => durationValidation(KEY, '30s')),
    '30s',
  );
  assert.strictEqual(
    withEnv('5m', () => durationValidation(KEY, '30s')),
    '5m',
  );
  assert.throws(() => withEnv('30x', () => durationValidation(KEY, '30s')), /should be a duration/);
});

test('stringValidation: optional form takes the default when unset', () => {
  assert.strictEqual(
    withEnv(undefined, () => stringValidation(KEY, 'fallback')),
    'fallback',
  );
  assert.strictEqual(
    withEnv('explicit', () => stringValidation(KEY, 'fallback')),
    'explicit',
  );
});

test('optionalStringValidation: absent, empty and whitespace all give null', () => {
  for (const raw of [undefined, '', '   ']) {
    assert.strictEqual(
      withEnv(raw, () => optionalStringValidation(KEY)),
      null,
      `expected ${JSON.stringify(raw)} to give null`,
    );
  }
  assert.strictEqual(
    withEnv('value', () => optionalStringValidation(KEY)),
    'value',
  );
});

test('booleanValidation: accepts booleans and rejects a typo instead of calling it false', () => {
  assert.strictEqual(
    withEnv('true', () => booleanValidation(KEY)),
    true,
  );
  assert.strictEqual(
    withEnv('false', () => booleanValidation(KEY)),
    false,
  );
  // `process.env.X === 'true'` turns every one of these into a silent `false`.
  for (const bad of ['tru', 'yes', '1', 'oui']) {
    assert.throws(
      () => withEnv(bad, () => booleanValidation(KEY)),
      /should be a boolean/,
      `expected ${JSON.stringify(bad)} to be rejected`,
    );
  }
  assert.strictEqual(
    withEnv(undefined, () => booleanValidation(KEY, false)),
    false,
  );
});
