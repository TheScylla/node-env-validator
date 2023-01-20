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
      .error(new Error(`process.env.'${envKey} should be a string`))
      .validate(process.env[envKey]),
  );
};

export const hostValidation = (envKey: string): string => {
  return validateValue(
    Joi.string()
      .hostname()
      .required()
      .error(new Error(`process.env.'${envKey} should be an host`))
      .validate(process.env[envKey]),
  );
};

export const oneOfArrayValidation = <T = unknown>(envKey: string): T => {
  return validateValue(
    Joi.valid(...['mysql', 'postgres', 'sqlite', 'mariadb', 'mssql', 'db2', 'snowflake', 'oracle'])
      .required()
      .error(new Error(`process.env.'${envKey} should be one of the input array`))
      .validate(process.env[envKey]),
  );
};

export const portValidation = (envKey: string): number => {
  return validateValue(
    Joi.number()
      .port()
      .required()
      .error(new Error(`process.env.'${envKey} should be a port`))
      .validate(process.env[envKey]),
  );
};

export const uriValidation = (envKey: string): string => {
  return validateValue(
    Joi.string()
      .uri()
      .required()
      .error(new Error(`process.env.'${envKey} should be an uri`))
      .validate(process.env[envKey]),
  );
};
