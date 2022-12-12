/* eslint-disable import/no-unresolved */
// const dotenv = require('dotenv');
// dotenv.config();

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');

const app = require('../src/index');
// const {jwtSign} = require('../src/utilities/authentication/helpers');
const co_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InBwcm90b3BzIiwiaWQiOiI2MzhkMDM1NjkzNGYxMzA2NTY3YzExNzUiLCJlbWFpbCI6InBwcm90b3BzQGVjZS5hdXRoLmdyIiwiaWF0IjoxNjcwODY1NDA5LCJleHAiOjE2NzA5MDE0MDl9.ydK3b6y00aKVi0myuXEWTgFDSECJquN4pIVB2SOnnQc'

require('dotenv').config(app.env);

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
});

test('GET /statistics returns correct response and status code', async (t) => {
  const { body, statusCode } = await t.context.got('general/statistics');
  t.is(body.sources, 0);
  t.assert(body.success);
  t.is(statusCode, 200);
});


test('GET /sources returns correct response and status code', async (t) => {
  const token = jwtSign({id: 1});
  const {statusCode} = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
});

// test.before(async (t) => {
//   const a = 1;
//   t.is(a + 1, 2);
// });