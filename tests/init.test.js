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
test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
});

test('GET /statistics returns correct response and status code', async (t) => {
  const {body, statusCode} = await t.context.got('general/statistics');
  t.is(body.sources, 0);
  t.assert(body.success);
  t.is(statusCode, 200);
});

test('GET /sources returns correct response and status code', async (t) => {
  //const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InN5bWVvbm1kIiwiaWQiOiI2Mzk2MTQ2YjkzNGYxMzA2NTY3YzExNzgiLCJlbWFpbCI6InN5bWVvbm1hc3RyYWtvdWxpc0BnbWFpbC5jb20iLCJpYXQiOjE2NzA5NDE4NjUsImV4cCI6MTY3MDk3Nzg2NX0.ntigSNPyKsb6xzREYMI9I05fuQ58oSxNgbAiGSRJCNM"
  obj = {"username":"symeonmd","id":"6396146b934f1306567c1178","email":"symeonmastrakoulis@gmail.com"}
  const token= jwtSign(obj);
  const {statusCode} = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
});
