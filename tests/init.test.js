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
  const token = jwtSign({id: 1});
  const {statusCode} = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
});











test.beforeEach(async t => {
  // Create a dashboard
  t.context.dashboard = new dashboard({name:'Test Dashboard',views: 0,owner: mongoose.Types.ObjectId()});
  await t.context.dashboard.save(); // Save it
  t.context.token = jwtSign({id: t.context.dashboard.owner});
});

test.afterEach.always(async t => {
  // Delete the dashboard 
  await t.context.dashboard.delete();
});

test('GET /dashboards returns correct response and status code and type', async t => {
  const token = t.context.token
  const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);

  t.is(statusCode,200)
  t.assert(body.success);
  t.is(typeof body.dashboards, 'object');
  t.is(body.dashboards.length, 1);
});

test('GET /dashboards with no dashboards return correct response and status code and type', async t => {
  // Create one empty dashboard to see if it's accurate
  const token = jwtSign({id: mongoose.Types.ObjectId()});
  const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);

  t.is(statusCode, 200);
  t.assert(body.success);
  t.is(typeof body.dashboards, 'object');
  t.is(body.dashboards.length, 0);
});


// test('GET /dashboards throws error on invalid token', async t => {
//   const token = jwtSign({id: 'invalid-id'});
//   const error = await t.throwsAsync(async () => {
//     await t.context.got(`dashboards/dashboards?token=${token}`, { throwHttpErrors: true });
//   });
//   console.log(error);
//   t.is(error.statusCode, 500);
//   t.truthy(error.response.body.error);
// });