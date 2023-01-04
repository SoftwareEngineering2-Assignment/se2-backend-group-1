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
const user = require('../src/models/user'); //?
const sinon = require('sinon'); 

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
  t.context.dashboard = new dashboard({name:'Test_Dashboard',views: 10,owner: mongoose.Types.ObjectId()});
  await t.context.dashboard.save(); // Save it
  t.context.token = jwtSign({id: t.context.dashboard.owner});

  // Create a user
  t.context.user = new user({username: 'username',password: 'password',email: 'email'});
  await t.context.user.save(); //?

  // Clear history
  sinon.resetHistory();
  sinon.restore();
  sinon.reset();
});

test.afterEach.always(async t => {
  await t.context.dashboard.delete(); // Delete the dashboard 
  user.findByIdAndDelete(user._id);
});



/*
* Tests for get /dashboards. One test for a correct given token, one for a token with no dashboards in it
* and one for when an error happens.  
*/ 
test('GET /dashboards returns correct response and status code and type of body', async t => {
  const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${t.context.token}`);

  t.is(statusCode,200)
  t.assert(body.success);
  t.is(typeof body.dashboards, 'object');
  t.is(body.dashboards.length, 1);
});

test('GET /dashboards with no dashboards return correct response and status code and type', async t => {
  // Create one empty dashboard to see if it's accurate
  const token = jwtSign({id: mongoose.Types.ObjectId()});
  const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
  t.is(typeof body.dashboards, 'object');
  t.is(body.dashboards.length, 0);
});



/*
* Tests for create-dashboard
*/
test('POST /create-dashboard return correct statusCode and success', async t => {
  const dashboardJson = {json: {name: t.context.dashboard,id: t.context.token}};
  const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /create-dashboard with duplicate name', async t => {
  const dashboardJson = {json: {name: t.context.dashboard.name,id: t.context.token}};
  const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.is(body.status, 409);
  t.deepEqual(body, {status: 409,message: 'A dashboard with that name already exists.'});
});



/*
* Tests for delete-dashboard
*/
test('POST /delete-dashboard return correct statusCode and success', async t => {
  const dashboardJson = {json: {token: t.context.token,id: t.context.dashboard._id}};
  const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});


test('POST /delete-dashboard with invalid id', async t => {

  const dashboardJson = {json: {token: 1,id: 1}};
  const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.is(body.status, 409);
  t.deepEqual(body, {status: 409,message: 'The selected dashboard has not been found.'});
});



/*
* Tests for dashboard
*/
test('GET /dashboard return correct statusCode and body', async t => {
  const id = t.context.dashboard.id;
  const { body, statusCode } = await t.context.got(`dashboards/dashboard?id=${id}&token=${t.context.token}`);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {success: true,sources: [],dashboard: {
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
  t.is(body.status, 409);
  t.deepEqual(body, {status: 409,message: 'The selected dashboard has not been found.'});
});



/*
* Tests for save-dashboard
*/
test('POST /save-dashboard return correct statusCode and body', async t => {
  const dashboardJson = {json: {id: t.context.dashboard._id, layout: {}, items: [], nextId: 1}};
  const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /save-dashboard with invalid id return correct statusCode, body and message', async t => {
  const dashboardJson = {json: {id: 1, layout: {}, items: [], nextId: 1}};
  const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.is(body.status, 409);
  t.is(body.message, 'The selected dashboard has not been found.');
});



/*
* Tests for clone-dashboard
*/
test('POST /clone-dashboard return correct statusCode and body', async t => {
  const dashboardJson = {json: {dashboardId: t.context.dashboard._id,name: 'New_Dashboard'}};
  const {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /clone-dashboard with duplicate name return correct statusCode and body', async t => {
  const dashboardJson = {json: {dashboardId: t.context.dashboard._id,name: t.context.dashboard.name}};
  const {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${t.context.token}`,dashboardJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.is(body.status, 409);
  t.is(body.message, 'A dashboard with that name already exists.');
});



/*
* Tests for check-password-needed
*/
// test('POST /check-password-needed with valid user and dashboardId', async t => {
//   const checkDashboard = await dashboard.create({name: 'check_dashboard',password: 'hellothere',shared: true,owner: t.context.user._id});
//   const dashboardJson = {json: {user: t.context.user, dashboardId: checkDashboard._id}};
//   const {body, statusCode} = await t.context.got.post('dashboards/check-password-needed',dashboardJson);

//   t.is(body.status, 200);
//   t.assert(body.success);
//   t.is(body.owner, 'self');
//   t.assert(body.shared);
//   t.is(body.hasPassword, false);
// });











/*
* Test for Error handlers
*/
// test('GET /dashboards error handler', async (t) => {
//   // Create a new dashboard
//   await dashboard.create({name: 'Test Dashboard',layout: [],items: {},nextId: 1,owner: user._id});
  
//   // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
//   // when called. Then replaces the original implementation of the find method with the fake implementation.
//   const findFake = sinon.stub(dashboard, 'find').throws(new Error('Internal server error occurred'));  
//   const {statusCode} = await t.context.got(`dashboards/dashboards?token=${t.context.token}`);
//   t.is(statusCode, 404);
//   findFake.restore();
// });

// test('POST /create-dashboard error handler', async (t) => {
//   // Create a new dashboard
//   await dashboard.create({name: 'Test Dashboard',layout: [],items: {},nextId: 1,owner: user._id});

//   // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
//   // when called. Then replaces the original implementation of the find method with the fake implementation.
//   const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));
//   const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
//   const {statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${t.context.token}`,dashboardJson);
//   t.is(statusCode, 404);
//   findFake.restore();
// });

// test('POST /delete-dashboard error handler', async (t) => {
//   // Create a new dashboard
//   await dashboard.create({name: 'Test Dashboard',layout: [],items: {},nextId: 1,owner: user._id});

//   // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
//   // when called. Then replaces the original implementation of the find method with the fake implementation.
//   const findFake = sinon.stub(dashboard, 'findOneAndRemove').throws(new Error('Internal server error occurred'));
//   const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
//   const {statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${t.context.token}`,dashboardJson);
//   t.is(statusCode, 404);
//   findFake.restore();
// });

// test('GET /dashboard error handler', async (t) => {
//   // Create a new dashboard
//   await dashboard.create({name: 'Test Dashboard',layout: [],items: {},nextId: 1,owner: user._id});
  
//   // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
//   // when called. Then replaces the original implementation of the find method with the fake implementation.
//   const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));  
//   const {statusCode} = await t.context.got(`dashboards/dashboard?token=${t.context.token}`);
//   t.is(statusCode, 404);
//   findFake.restore();
// });