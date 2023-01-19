/* eslint-disable import/no-unresolved */
/*
* Import .env, node:http, ava, got, test-listen and helpers from utilities for the tests.
*/  
require('dotenv').config();
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const sinon = require('sinon');
const app = require('../src/index'); 

// Creates an HTTP server using the app variable, which is an Express application.
// Returns promise resolves to the prefixUrl variable.
// Extended with options for HTTP2 support, error handling, JSON response type, and the prefixUrl variable.
test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

// Closes the server
test.after.always((t) => {
  t.context.server.close();
});

/*
* Testing general/statistics  
*/
test('GET /statistics returns correct response and status code', async (t) => {
    const { body, statusCode } = await t.context.got('general/statistics');
    t.assert(body.success);
    t.is(statusCode, 200);
});

/*
* Testing general/test-url  
*/
test('GET /test-url with a valid URL returns 200 and active: true', async (t) => {
    const {body, statusCode} = await t.context.got('general/test-url?url=https://se2-frontend.netlify.app/');
    t.is(statusCode, 200);
    t.assert(body.active);
});

test('GET /test-url with an invalid URL returns 500 and active: false', async (t) => {
  const {body, statusCode} = await t.context.got('general/test-url?url=https://se2-frontend-1.netlify.ap');
  t.is(body.status, 500);
  t.is(body.active, false);
});

test('GET /test-url without a URL query parameter returns 500 and active: false', async (t) => {
  const {body, statusCode} = await t.context.got('general/test-url?url=');
  t.is(body.status, 500);
  t.is(body.active, false);
});

/*
* Testing general/test-url-request
*/
test('GET /test-url-request with a GET request returns the correct response', async (t) => {
    const {statusCode, body} = await t.context.got('general/test-url-request?url=https://se2-frontend.netlify.app/&type=GET');
    t.is(statusCode, 200);
    t.assert(body);
});
  
test('GET /test-url-request with a POST request returns the correct response', async (t) => {
    const {statusCode, body} = await t.context.got(`general/test-url-request?url=https://httpbin.org/post&type=POST`);
    t.is(statusCode, 200);
    t.assert(body);
  });

test('GET /test-url-request with a PUT request returns the correct response', async (t) => {
    const {statusCode, body} = await t.context.got(`general/test-url-request?url=https://httpbin.org/put&type=PUT`);
    t.is(statusCode, 200);
    t.assert(body);
});

test('GET /test-url-request with an invalid request returns the correct response', async (t) => {
    const {statusCode, body} = await t.context.got('general/test-url-request?url=https://se2-frontend-1.netlify.app&type=AA');
    t.is(statusCode, 200);
    t.is(body.status, 500);
    t.assert(body);
});

test('GET /test-url-request with an invalid URL returns a 500 error', async (t) => {
    const {statusCode, body} = await t.context.got('general/test-url-request?url=hpp://sadko.com&type=GET');
    t.is(statusCode, 200);
    t.is(body.status, 500);
    t.assert(body);
});
