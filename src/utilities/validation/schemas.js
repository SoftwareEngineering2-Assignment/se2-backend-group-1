// Import Ramda, Yup, and constants.
const { isNil } = require('ramda');
const yup = require('yup');
const { min } = require('./constants');

// Define common schema types for email, username, and password fields.
const emailSchema = yup
  .string()
  .lowercase()
  .trim()
  .email();

const usernameSchema = yup
  .string()
  .trim();

const passwordSchema = yup
  .string()
  .trim()
  .min(min);

// Define request schema with a required username field.
const requestSchema = yup.object().shape({username: usernameSchema.required()});

// Define authenticate schema with required username and password fields.
const authenticateSchema = yup.object().shape({
  username: usernameSchema.required(),
  password: passwordSchema.required()
});
// Define register schema with required email, username, and password fields.
const registerSchema = yup.object().shape({
  email: emailSchema.required(),
  password: passwordSchema.required(),
  username: usernameSchema.required()
});

// Define update schema with optional username and password fields, and a custom test to ensure that at least one of them is not null.
const updateSchema = yup.object().shape({
  username: usernameSchema,
  password: passwordSchema,
}).test({
  message: 'Missing parameters',
  test: ({username: u, password: p}) => !(isNil(u) && isNil(p))
});

// Define change schema with a required password field.
const changeSchema = yup.object().shape({
  password: passwordSchema.required(),
});

// Export schemas for request, authenticate, register, update, and change.
module.exports = {
  authenticate: authenticateSchema,
  register: registerSchema,
  request: requestSchema,
  change: changeSchema,
  update: updateSchema,
};
