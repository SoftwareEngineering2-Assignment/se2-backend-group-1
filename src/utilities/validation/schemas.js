/*
* Import ramda, yup and constants.
*/
const {isNil} = require('ramda');
const yup = require('yup');
const {min} = require('./constants');

// Make it string, lowercase, trimmed and email.
const email = yup
  .string()
  .lowercase()
  .trim()
  .email();

/*
* Make it string and trimmed.
*/
const username = yup
  .string()
  .trim();

// Make it string, trimmed and ensure that password has at least min characters.
const password = yup
  .string()
  .trim()
  .min(min);

// Create a Yup request schema for an object.
const request = yup.object().shape({username: username.required()});

// Create a Yup authenticate schema for an object, with username and password required.
const authenticate = yup.object().shape({
  username: username.required(),
  password: password.required()
});

// Create a Yup register schema for an object, with username, email and password required.
const register = yup.object().shape({
  email: email.required(),
  password: password.required(),
  username: username.required()
});

// Create a Yup register schema for an object, with username and password and check if one is not null.
const update = yup.object().shape({
  username,
  password
}).test({
  message: 'Missing parameters',
  test: ({username: u, password: p}) => !(isNil(u) && isNil(p))
});

// Create a Yup register schema for an object, with password required.
const change = yup.object().shape({password: password.required()});

// Export authenticate, register, request, change and update.
module.exports = {
  authenticate, register, request, change, update
};
