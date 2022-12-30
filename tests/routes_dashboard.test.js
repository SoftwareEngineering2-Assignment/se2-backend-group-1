require('dotenv').config();
// process.env.PORT = 3001;
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const mongoose = require('mongoose');

const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const dashboard = require('../src/models/dashboard');

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
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



