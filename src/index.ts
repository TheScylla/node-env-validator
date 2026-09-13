import Joi from 'joi';

const validateValue = <T>(x: Joi.ValidationResult<T>) => {
  if (x.error) {
    throw x.error;
  }
  return x.value;
};

/**
 * A non-empty string, with an optional default.
 *
 * Same asymmetry as every defaulted validator here: an UNSET key takes the
 * default, a key SET to something invalid still throws.
 */
export const stringValidation = (envKey: string, defaultValue?: string): string => {
  const schema =
    defaultValue === undefined ? Joi.string().required() : Joi.string().default(defaultValue);

  return validateValue(
    schema
      .error(new Error(`process.env.${envKey} should be a string`))
      .validate(process.env[envKey]),
  );
};

/**
 * A string when there is one, `null` when there is not.
 *
 * For genuinely absent settings, where "not configured" is a state the
 * application handles rather than an error. A key set to whitespace counts as
 * absent — an operator who left `KEY=` in a file meant nothing, not " ".
 *
 * Reach for this only when `null` is a case the caller actually handles. When a
 * missing value should stop the boot, use `stringValidation`; when it has a
 * sensible fallback, give `stringValidation` a default.
 */
export const optionalStringValidation = (envKey: string): string | null => {
  const value = process.env[envKey];

  return value !== undefined && value.trim().length > 0 ? value : null;
};

export const hostValidation = (envKey: string): string => {
  return validateValue(
    Joi.string()
      .hostname()
      .required()
      .error(new Error(`process.env.${envKey} should be an host`))
      .validate(process.env[envKey]),
  );
};

export const oneOfArrayValidation = <T = unknown>(envKey: string, inputArray: unknown[]): T => {
  return validateValue(
    Joi.valid(...inputArray)
      .required()
      .error(new Error(`process.env.${envKey} should be one of the input array`))
      .validate(process.env[envKey]),
  );
};

export const portValidation = (envKey: string): number => {
  return validateValue(
    Joi.number()
      .port()
      .required()
      .error(new Error(`process.env.${envKey} should be a port`))
      .validate(process.env[envKey]),
  );
};

export const uriValidation = (envKey: string): string => {
  return validateValue(
    Joi.string()
      .uri()
      .required()
      .error(new Error(`process.env.${envKey} should be an uri`))
      .validate(process.env[envKey]),
  );
};

/** A duration written as a count and a unit: `30s`, `15m`, `2h`. */
export type Duration = `${number}s` | `${number}m` | `${number}h`;

const DURATION_PATTERN = /^\d+(?:\.\d+)?[smh]$/;

/**
 * A duration such as `30s`, `15m` or `2h`, with an optional default.
 *
 * The point is the check, not the type. Twelve configurations across this
 * ecosystem declared the same template-literal type and then wrote
 * `return value as Duration` — a cast, which TypeScript erases. `30x` and `abc`
 * both reached the rate limiter as "valid" windows, because nothing ever looked
 * at the value at runtime. This looks.
 *
 * The unit set is deliberately `s`, `m`, `h` and nothing else: it is what the
 * existing `RateLimitWindow` type allows, and widening it here would silently
 * accept values the consumers' own types reject.
 */
export const durationValidation = (envKey: string, defaultValue?: Duration): Duration => {
  const schema =
    defaultValue === undefined
      ? Joi.string().pattern(DURATION_PATTERN).required()
      : Joi.string().pattern(DURATION_PATTERN).default(defaultValue);

  const value = validateValue(
    schema
      .error(new Error(`process.env.${envKey} should be a duration such as 30s, 15m or 2h`))
      .validate(process.env[envKey]),
  );

  // Joi hands back a `string`. The cast is the LAST step rather than the only one:
  // `DURATION_PATTERN` has already run, so the value provably matches the template
  // type. That is exactly the guarantee the consumers' `value as RateLimitWindow`
  // lacked — same cast, but after a check rather than in place of one.
  return value as Duration;
};

/**
 * A boolean, with an optional default.
 *
 * Accepts what Joi accepts — `true`/`false`, and the strings of both. A key set
 * to anything else throws rather than quietly becoming `false`, which is what
 * `process.env.X === 'true'` does to every typo.
 */
export const booleanValidation = (envKey: string, defaultValue?: boolean): boolean => {
  const schema =
    defaultValue === undefined ? Joi.boolean().required() : Joi.boolean().default(defaultValue);

  return validateValue(
    schema
      .error(new Error(`process.env.${envKey} should be a boolean`))
      .validate(process.env[envKey]),
  );
};

/**
 * A finite number, with an optional default.
 *
 * Without `defaultValue` the key is required, like every other validator here.
 * With one, an UNSET key takes the default — but a key that is SET and not a
 * finite number still throws. That asymmetry is the whole point: it is the shape
 * every hand-rolled `Number(process.env.X ?? '30')` gets wrong.
 *
 * A bare `Number()` turns a typo into `NaN` and hands it to the application,
 * where it usually surfaces far from its cause and long after boot. Silently
 * falling back to the default instead is no better for anything metered: an
 * operator who writes `5` to stay under a quota and fat-fingers it does not want
 * `30`, they want to be told.
 *
 * `Infinity` and `NaN` are rejected, so the value is always finite.
 */
export const numberValidation = (envKey: string, defaultValue?: number): number => {
  const schema =
    defaultValue === undefined ? Joi.number().required() : Joi.number().default(defaultValue);

  return validateValue(
    schema
      .error(new Error(`process.env.${envKey} should be a finite number`))
      .validate(process.env[envKey]),
  );
};
