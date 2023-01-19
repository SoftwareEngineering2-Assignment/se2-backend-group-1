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

    // Clear history
    sinon.resetHistory();
    sinon.restore();
    sinon.reset();
});

// Before each test delete the previous dashboards
test.afterEach.always(async t => {
    await t.context.dashboard.delete(); // Delete the dashboard 
    user.findByIdAndDelete(user._id);
});

// Test for /check-password with invalid id'
test('POST /check-password dashboard invalid id', async t => {
    const dashboardJson = {json: {dashboardId: -1, password: t.context.dashboard.password}};
    const {body, statusCode} = await t.context.got.post(`dashboards/check-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        status: 409,
        message: 'The specified dashboard has not been found.'
    })
});

// Test /check-password with wrong password
test('POST /check-password dashboard with wrong password', async t => {
    const dashboardJson = {json: {dashboardId: t.context.dashboard.id, password: ""}};
    const {body, statusCode} = await t.context.got.post(`dashboards/check-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {success: true, correctPassword: false})
});

// Tests for /share-dashboard with valid dashboard id
test('POST /share-dashboard valid dashboard id', async t => {
    const dashboardJson = {json: {dashboardId: t.context.dashboard.id}};
    const {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {success: true, shared: !t.context.dashboard.shared})
});

// Tests for /share-dashboard with invalid dashboard id
test('POST /share-dashboard invalid dashboard id', async t => {
    const dashboardJson = {json: {dashboardId: -1}};
    const {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        status: 409,
        message: 'The specified dashboard has not been found.'
    })
});

// Tests for /change-password with valid dashboard id
test('POST /change-password valid dashboard id', async t => {
    const dashboardJson = {json: {dashboardId: t.context.dashboard.id, password: "new password"}};
    const {body, statusCode} = await t.context.got.post(`dashboards/change-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.assert(body.success);
});

// Tests for /change-password with invalid dashboard id
test('POST /change-password invalid dashboard id', async t => {
    const dashboardJson = {json: {dashboardId: -1, password: "new password"}};
    const {body, statusCode} = await t.context.got.post(`dashboards/change-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        status: 409,
        message: 'The specified dashboard has not been found.'
    })
});
