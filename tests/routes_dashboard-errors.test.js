require('dotenv').config();
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const mongoose = require('mongoose');
const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const dashboard = require('../src/models/dashboard');
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
    t.context.dashboard = new dashboard({name:'Test_Dashboard',views: 10, shared: false, layout: [],
                                        item: {}, password: "Test_Password",owner: mongoose.Types.ObjectId()});
    await t.context.dashboard.save(); // Save it
    t.context.token = jwtSign({id: t.context.dashboard.owner});

    // Clear history
    sinon.resetHistory();
    sinon.restore();
    sinon.reset();

    // Create a new dashboard
    await dashboard.create({name: 'Test Dashboard',layout: [],items: {},nextId: 1,owner: mongoose.Types.ObjectId()});
});

test.afterEach.always(async t => {
    await t.context.dashboard.delete(); // Delete the dashboard 
});

// Test for Error handler on /dashboards 
test('GET /dashboards error handler', async (t) => {
  // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
  // when called. Then replaces the original implementation of the find method with the fake implementation.
  const findFake = sinon.stub(dashboard, 'find').throws(new Error('Internal server error occurred'));  
  const {statusCode} = await t.context.got(`dashboards/dashboards?token=${t.context.token}`);
  t.is(statusCode, 404);
  findFake.restore();
});

// Test for Error handler on /create-dashboard 
test('POST /create-dashboard error handler', async (t) => {
  // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
  // when called. Then replaces the original implementation of the find method with the fake implementation.
  const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));
  const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
  const {statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${t.context.token}`,dashboardJson);
  t.is(statusCode, 404);
  findFake.restore();
});

// Test for Error handler on /delete-dashboard
test('POST /delete-dashboard error handler', async (t) => {
  // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
  // when called. Then replaces the original implementation of the find method with the fake implementation.
  const findFake = sinon.stub(dashboard, 'findOneAndRemove').throws(new Error('Internal server error occurred'));
  const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
  const {statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${t.context.token}`,dashboardJson);
  t.is(statusCode, 404);
  findFake.restore();
});

// Test for Error handler on /dashboard 
test('GET /dashboard error handler', async (t) => {
  // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
  // when called. Then replaces the original implementation of the find method with the fake implementation.
  const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));  
  const {statusCode} = await t.context.got(`dashboards/dashboard?token=${t.context.token}`);
  t.is(statusCode, 404);
  findFake.restore();
});

// Test for Error handler on /save-dashboard 
test('POST /save-dashboard error handler', async (t) => {
    // Creates a fake implementation of the findOneAndUpdate method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the findOneAndUpdate method with the fake implementation.
    const findFake = sinon.stub(dashboard, 'findOneAndUpdate').throws(new Error('Internal server error occurred'));
  
    // Send a POST request to the /save-dashboard route with the ID of the newly created dashboard
    const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
    const {statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 404);

    // Restore the original findFake method of the dashboard object
    findFake.restore();
  });

// Test for Error handler on /clone-dashboard 
test('POST /clone-dashboard error handler', async (t) => {
    // Creates a fake implementation of the findOne method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the findOne method with the fake implementation.
    const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));
  
    // Send a POST request to the /save-dashboard route with the ID of the newly created dashboard
    const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
    const {statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 404);

    // Restore the original findFake method of the dashboard object
    findFake.restore();
});

// Test for Error handler on /check-password-needed
test('POST /check-password-needed error handler', async (t) => {
    // Creates a fake implementation of the findOne method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the findOne method with the fake implementation.
    const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));
  
    // Send a POST request to the /save-dashboard route with the ID of the newly created dashboard
    const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
    const {statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 404);

    // Restore the original findFake method of the dashboard object
    findFake.restore();
});

// Test for Error handler on /check-password
test('POST /check-password error handler', async (t) => {
    // Creates a fake implementation of the findOne method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the findOne method with the fake implementation.
    const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));
  
    // Send a POST request to the /save-dashboard route with the ID of the newly created dashboard
    const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
    const {statusCode} = await t.context.got.post(`dashboards/check-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 404);

    // Restore the original findFake method of the dashboard object
    findFake.restore();
});

// Test for Error handler on /share-dashboard
test('POST /share-dashboard error handler', async (t) => {
    // Creates a fake implementation of the findOne method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the findOne method with the fake implementation.
    const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));
  
    // Send a POST request to the /save-dashboard route with the ID of the newly created dashboard
    const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
    const {statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 404);

    // Restore the original findFake method of the dashboard object
    findFake.restore();
});

// Test for Error handler on /change-password
test('POST /change-password error handler', async (t) => {
    // Creates a fake implementation of the findOne method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the findOne method with the fake implementation.
    const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));
  
    // Send a POST request to the /save-dashboard route with the ID of the newly created dashboard
    const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
    const {statusCode} = await t.context.got.post(`dashboards/change-password?token=${t.context.token}`,dashboardJson);
    t.is(statusCode, 404);

    // Restore the original findFake method of the dashboard object
    findFake.restore();
});
