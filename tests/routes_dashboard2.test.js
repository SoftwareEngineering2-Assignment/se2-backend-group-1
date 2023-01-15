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
const sinon = require('sinon'); 
// const { string } = require('yup');

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
    t.context.dashboard = new dashboard({name:'Test_Dashboard',views: 10, shared: false, layout: [],
                                        item: {}, password: "Test_Password",owner: mongoose.Types.ObjectId()});
    await t.context.dashboard.save(); // Save it
    t.context.token = jwtSign({id: t.context.dashboard.owner});

    // Create a user
    t.context.user = new user({username: 'username',password: 'password',email: 'email'});
    await t.context.user.save();

    // Clear history
    sinon.resetHistory();
    sinon.restore();
    sinon.reset();
});

test.afterEach.always(async t => {
    await t.context.dashboard.delete(); // Delete the dashboard 
    user.findByIdAndDelete(user._id);
});


// Tests for check-password
// test('POST /check-password with valid password and dashboardId', async t => {
//   const checkDashboard = await dashboard.create({name: 'check_dashboard',password: 'hellothere',shared: false,owner: t.context.user.id});
//   const dashboardJson = {json: {password: checkDashboard.password, dashboardId: checkDashboard.id}};
//   const {body, statusCode} = await t.context.got.post(`dashboards/check-password?token=${t.context.token}`,dashboardJson);
//   t.is(statusCode, 200);
//   t.deepEqual(body, {success: true, correctPassword: true, owner: t.context.dashboard.owner,
//   dashboard: {name: t.context.dashboard.name, layout: t.context.dashboard.layout, items: t.context.dashboard.items}})
// });

test('POST /check-password dashboard invalid id', async t => {
    const dashboardJson = {json: {dashboardId: -1, password: t.context.dashboard.password}};
    const {body, statusCode} = await t.context.got.post(`dashboards/check-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        status: 409,
        message: 'The specified dashboard has not been found.'
    })
});

test('POST /check-password dashboard with wrong password', async t => {
    const dashboardJson = {json: {dashboardId: t.context.dashboard.id, password: ""}};
    const {body, statusCode} = await t.context.got.post(`dashboards/check-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {success: true, correctPassword: false})
});

// Tests for dashboard share
test('POST /share-dashboard valid dashboard id', async t => {
    const dashboardJson = {json: {dashboardId: t.context.dashboard.id}};
    const {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {success: true, shared: !t.context.dashboard.shared})
});

test('POST /share-dashboard invalid dashboard id', async t => {
    const dashboardJson = {json: {dashboardId: -1}};
    const {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        status: 409,
        message: 'The specified dashboard has not been found.'
    })
});

// Tests for dashboard share
test('POST /change-password valid dashboard id', async t => {
    const dashboardJson = {json: {dashboardId: t.context.dashboard.id, password: "new password"}};
    const {body, statusCode} = await t.context.got.post(`dashboards/change-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.assert(body.success);
});

test('POST /change-password invalid dashboard id', async t => {
    const dashboardJson = {json: {dashboardId: -1, password: "new password"}};
    const {body, statusCode} = await t.context.got.post(`dashboards/change-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        status: 409,
        message: 'The specified dashboard has not been found.'
    })
});

// Tests for Error handlers
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