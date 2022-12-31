/* eslint-disable import/no-unresolved */
/*
* Import .env, node:http, ava, got, test-listen and helpers from utilities for the tests.
*/ 
require('dotenv').config();

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');

const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const password = require('../src/utilities/mailer/password');

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
});

/*
* Test for utilities/mailer/password
*/
test('utilities/mailer/password', (t) => {
  // Initialize token and email
  const token = 'hello2000';
  const email = password(token);

  // See if the email contains the correct base URL and token
  t.true(email.includes(process.env.PLATFORM_URI));
  t.true(email.includes(process.env.SERVER_URI));
  t.true(email.includes(token));
});


// test('GET /sources returns correct response and status code', async (t) => {
//   const token = jwtSign({id: 1});
//   const {statusCode} = await t.context.got(`sources/sources?token=${token}`);
//   t.is(statusCode, 200);
// });
