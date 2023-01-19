require('dotenv').config();
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const mongoose = require('mongoose');
const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const dashboard = require('../src/models/dashboard');
const user = require('../src/models/user');
const sources = require('../src/models/source');

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

// Before each test create two dashboards and clear, reset and restore sinon 
test.beforeEach(async t => {
  // Create a dashboard
  t.context.dashboard = new dashboard({name:'Test_Dashboard',views: 10, shared: false, layout: [],
                                    item: {}, password: "Test_Password",owner: mongoose.Types.ObjectId()});
  await t.context.dashboard.save(); // Save it
  t.context.token = jwtSign({id: t.context.dashboard.owner});

  // Create a user
  t.context.user = new user({username: 'username',password: 'password',email: 'email'});
  await t.context.user.save();
});

// Before each test delete the previous dashboards
test.afterEach.always(async t => {
  await t.context.dashboard.delete(); // Delete the dashboard 
  user.findByIdAndDelete(user._id);
});

// Tests for get /dashboards. One test for a correct given token, one for a token with no dashboards in it and one for when an error happens.  
test('GET /dashboards returns correct response and status code and type of body', async t => {
  const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${t.context.token}`);

  t.is(statusCode,200)
  t.assert(body.success);
  t.is(body.dashboards.length, 1);
  length = body.dashboards.length;
  t.is(typeof body.dashboards[length-1], 'object');
  t.deepEqual(body.dashboards[length-1], {id: body.dashboards[length-1].id,
  name: 'Test_Dashboard', views: 10});
});

// Tests for create-dashboard 
test('POST /create-dashboard return correct statusCode and success', async t => {
  const dashboardJson = {json: {name: t.context.dashboard,id: t.context.token}};
  const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /create-dashboard with duplicate name', async t => {
  const dashboardJson = {json: {name: t.context.dashboard.name,id: t.context.dashboard.id}};
  const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409,message: 'A dashboard with that name already exists.'});
});

// Tests for delete-dashboard
test('POST /delete-dashboard return correct statusCode and success', async t => {
  const dashboardJson = {json: {id: t.context.dashboard.id}};
  const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /delete-dashboard with invalid id', async t => {

  const dashboardJson = {json: {id: 1}};
  const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409,message: 'The selected dashboard has not been found.'});
});

// Tests for dashboard
test('GET /dashboard return correct statusCode and body', async t => {
  t.context.sources = new sources({name: "Test_Sources", owner: t.context.dashboard.owner,
  type: "Test_Type", url: "Test_Url", login: "Test_Login", 
  passcode: "Test_Passcode", vhost: "Test_Vhost"});
  await t.context.sources.save(); // Save it
  const id = t.context.dashboard.id;
  const { body, statusCode } = await t.context.got(`dashboards/dashboard?id=${id}&token=${t.context.token}`);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {success: true,sources: ['Test_Sources'],dashboard: {
      id: t.context.dashboard.id,
      name: t.context.dashboard.name,
      layout: [],
      items: t.context.dashboard.items,
      nextId: t.context.dashboard.nextId,
    }
  });
});

test('GET /dashboard with invalid id return correct statusCode, body and message', async t => {
  const { body, statusCode } = await t.context.got(`dashboards/dashboard?id=${mongoose.Types.ObjectId()}&token=${t.context.token}`);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409,message: 'The selected dashboard has not been found.'});
});

// Tests for save-dashboard
test('POST /save-dashboard return correct statusCode and body', async t => {
  const dashboardJson = {json: {id: t.context.dashboard.id, layout: {}, items: [], nextId: 1}};
  const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /save-dashboard with invalid id return correct statusCode, body and message', async t => {
  const dashboardJson = {json: {id: -1, layout: {}, items: [], nextId: 1}};
  const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409, message: 'The selected dashboard has not been found.'});
});

// Tests for clone-dashboard
test('POST /clone-dashboard return correct statusCode and body', async t => {
  const dashboardJson = {json: {dashboardId: t.context.dashboard.id,name: 'New_Dashboard'}};
  const {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${t.context.token}`,dashboardJson);
  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /clone-dashboard with duplicate name return correct statusCode and body', async t => {
  const dashboardJson = {json: {dashboardId: t.context.dashboard.id,name: t.context.dashboard.name}};
  const {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${t.context.token}`,dashboardJson);
  // Test for the correct values
  t.is(statusCode, 200);
  t.is(body.status, 409);
  t.deepEqual(body, {status: 409, message: 'A dashboard with that name already exists.'});
});

// Tests for check-password-needed
test('POST /check-password-needed with valid user and dashboardId', async t => {
  const checkDashboard = await dashboard.create({name: 'check_dashboard',password: 'hellothere',shared: true,owner: t.context.user.id});
  const dashboardJson = {json: {user: t.context.user, dashboardId: checkDashboard.id}};
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${t.context.token}`,dashboardJson);
  t.is(statusCode, 200);
  t.deepEqual(body, {success: true, owner: '', shared: true, passwordNeeded: true});
});

test('POST /check-password-needed Dashboard not found', async t => {
  const dashboardJson = {json: {user: t.context.user, dashboardId: -1}};
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${t.context.token}`,dashboardJson);
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409, message: 'The specified dashboard has not been found.'});
});

test('POST /check-password-needed not shared', async t => {
  const checkDashboard = await dashboard.create({name: 'check_dashboard',password: 'hellothere',shared: false,owner: t.context.user.id});
  const dashboardJson = {json: {user: t.context.user, dashboardId: checkDashboard.id}};
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${t.context.token}`,dashboardJson);
  t.is(statusCode, 200);
  t.deepEqual(body,{success: true,owner: '',shared: false});
});
