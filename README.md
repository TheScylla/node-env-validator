# node-env-validator

Validate the unsafe inputs your process starts with — `.env` values — at boot, where a bad one is
cheap to diagnose, instead of somewhere deep in the application hours later.

Every validator reads `process.env[key]` and **throws** when the value does not fit. Nothing returns
`undefined`, `NaN`, or a silently coerced value.

## Example

```
PORT=1234
USERNAME=my-username
NOT_AN_URI=HELLO
```

```ts
import {
  portValidation,
  stringValidation,
  uriValidation,
  numberValidation,
} from 'node-env-validator';

const config = {
  port: portValidation('PORT'),
  username: stringValidation('USERNAME'),
  notAnUri: uriValidation('NOT_AN_URI'), // Will throw an error

  // Required: absent or malformed both throw.
  maxRetries: numberValidation('MAX_RETRIES'),

  // Optional with a default: absent takes 30, malformed still throws.
  ratePerMinute: numberValidation('RATE_PER_MINUTE', 30),
};
```

## Validators

| Validator | Returns | Throws when |
|---|---|---|
| `stringValidation(key)` | `string` | unset, or empty |
| `hostValidation(key)` | `string` | unset, or not a hostname |
| `uriValidation(key)` | `string` | unset, or not a URI |
| `portValidation(key)` | `number` | unset, or not a valid port |
| `oneOfArrayValidation(key, values)` | `T` | unset, or outside `values` |
| `numberValidation(key)` | `number` | unset, or not a finite number |
| `numberValidation(key, default)` | `number` | set **and** not a finite number |

### `numberValidation` and its one asymmetry

With a default, an **unset** key takes the default — but a key that is **set** and not a finite
number still throws. That is the whole reason it exists, because it is the case every hand-rolled
version gets wrong:

```ts
// Turns a typo into NaN and hands it to the application, where it surfaces far
// from its cause and long after boot.
const rate = Number(process.env.RATE_PER_MINUTE ?? '30');

// Falls back on a typo, which is no better for anything metered: an operator who
// writes `5` to stay under a quota and fat-fingers it does not want 30.
const rate = Number.isFinite(n) ? n : 30;
```

`Infinity`, `-Infinity` and `NaN` are rejected, so the value is always finite.

## Changelog

### 0.1.0

- **Added `numberValidation(key, default?)`** — a finite number, required by default, optional when
  given a fallback.
- **Fixed a stray quote in every error message.** They read `process.env.'KEY should be a string`;
  they now read `process.env.KEY should be a string`. If anything of yours matches on that text,
  this is a breaking change for it.
- Added a test suite (`npm test`, Node's built-in runner — no new dependency).
