
// Import ramda, yup and constants.
const {isNil} = require('ramda');
const yup = require('yup');
const {min} = require('./constants');


//  Make email string, lowercase, trimmed and email. Make username string and trimmed. 
//  Make pasword string, trimmed and ensure that password has at least min characters.
const email = yup
  .string()
  .lowercase()
  .trim()
  .email();

const username = yup
  .string()
  .trim();

const password = yup
  .string()
  .trim()
  .min(min);


// Make request with username required. Make authenticate with username and password required. Make register with username, email and password required.
// Make update with username and password and check if one is not null. Make register schema, with password required.
const request = yup.object().shape({username: username.required()});

const authenticate = yup.object().shape({
  username: username.required(),
  password: password.required()
});

const register = yup.object().shape({
  email: email.required(),
  password: password.required(),
  username: username.required()
});

const update = yup.object().shape({
  username,
  password
}).test({
  message: 'Missing parameters',
  test: ({username: u, password: p}) => !(isNil(u) && isNil(p))
});

const change = yup.object().shape({password: password.required()});

// Export authenticate, register, request, change and update.
module.exports = {
  authenticate, register, request, change, update
};
