import Joi from 'joi';

const validateValue = <T>(x: Joi.ValidationResult<T>) => {
  if (x.error) {
    throw x.error;
  }
  return x.value;
};

export const stringValidation = (envKey: string): string => {
  return validateValue(
    Joi.string()
      .required()
      .error(new Error(`process.env.${envKey} should be a string`))
      .validate(process.env[envKey]),
  );
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
