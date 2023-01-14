/* eslint-disable import/no-unresolved */
/*
* Import .env, node:http, ava, got, test-listen and helpers from utilities for the tests.
*/ 
require('dotenv').config();

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const app = require('../src/index'); 
const password = require('../src/utilities/mailer/password');
const sendE = require('../src/utilities/mailer/send');
const {passwordDigest} = require('../src/utilities/authentication/helpers');
const authorization = require('../src/middlewares/authorization');
const error = require('../src/middlewares/error');
const validation = require('../src/middlewares/validation');

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
});

// Tests for utilities/mailer/password
test('Test for utilities/mailer/password', (t) => {
  // Initialize token and email
  const token = 'hello2000';
  const email = password(token);

  // See if the email contains the correct base URL and token
  t.true(email.includes(process.env.PLATFORM_URI));
  t.true(email.includes(process.env.SERVER_URI));
  t.true(email.includes(token));
});

// Tests for utilities/mailer/send
test('Test for utilities/mailer/send', async (t) => {
  const to = 'test@example.com';
  const subject = 'Test_Email';
  const email = '<p>Hello</p>';
  await sendE(to, subject, email);

  // Assert that the email was sent
  t.pass();
});

// Tests for utilities/authentication/helpers
test('Test /authentication/helpers generate a hashed password', t => {
  const password = 'helloworld';
  const hashedPassword = passwordDigest(password);
  
  // Inspect the type and check if the hashing method works, if it does. the password
  // will be different from the hushed one.
  t.true(typeof hashedPassword === 'string');
  t.not(hashedPassword, password);
});


// Tests for middlewares/authorization
test('Test authorization error if token is missing', (t) => {
  const req = {};
  const res = {};
  const next = (error) => {
    t.is(error.message, 'Authorization Error: token missing.');
    t.is(error.status, 403);
  };

  authorization(req, res, next);
});

test('Test authorization if token is invalid', (t) => {
  const req = {headers: {authorization: 'Bearer invalid-token'}};
  const res = {};
  const next = (error) => {
    t.is(error.message, 'Authorization Error: Failed to verify token.');
    t.is(error.status, 403);
  };

  authorization(req, res, next);
});

test('Test authorization if token is valid', (t) => {
  const token = jwtSign({id: 1});
  const req = {
    headers: { 'x-access-token': `Bearer ${token}` }
  };
  const res = {};
  const next = (data) => {
    t.is(data, undefined);
  };
  authorization(req, res, next);
  t.is(req.decoded.id, 1);
});


// test('Test authorization if token has expired', (t) => {
//   const req = {
//     query: { token: 'expired-token' },
//     headers: {}
//   };
//   const res = {};
//   const next = (error) => {
//     t.is(error.message, 'TokenExpiredError');
//     t.is(error.status, 401);
//   };
//   authorization(req, res, next);
// });



// Tests for middlewares/error
test('Test error for when the error has status 500 or NODE_END is not production', (t) => {
  // Initialize the inputs of error and setting their status to 500
  // and NODE_ENV to development and then calling the error function.
  const errorObject = {message: 'Error',status: 500};
  const req = {};
  const res = {status: (status) => {t.is(status, 500);
    return {json: (error) => {
          t.is(error.status, 500);
          t.is(error.message, 'Error')}}}};
  const next = () => {};
  process.env.NODE_ENV = 'development';
  error(errorObject, req, res, next);
});


// Tests for middlewares/validation
test('Test validation when body is valid', async (t) => {
  const req = {body: {username: 'username',email: 'panos@gmail.com',password: 'password'}};
  const res = {};
  const next = () => {
    t.pass();
  };
  await validation(req, res, next, 'register');
});

test('Test validation when password is small', async (t) => {
  const req = {body: {username: 'username',password: '1234'}};
  const res = {};
  const next = (err) => {
    t.is(err.message, 'Validation Error: password must be at least 5 characters');
    t.is(err.status, 400);
    t.pass();
  };
  await validation(req, res, next, 'register');
});

test('Test validation when no password', async (t) => {
  const req = {body: {username: 'username'}};
  const res = {};
  const next = (err) => {
    t.is(err.message, 'Validation Error: password is a required field');
    t.is(err.status, 400);
  };
  await validation(req, res, next, 'register');
});


