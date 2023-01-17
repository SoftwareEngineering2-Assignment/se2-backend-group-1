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
});

test.afterEach.always(async t => {
    await t.context.dashboard.delete(); // Delete the dashboard 
});

// Tests for Error handlers
test('GET /dashboards error handler', async (t) => {
  // Create a new dashboard
  await dashboard.create({name: 'Test Dashboard',layout: [],items: {},nextId: 1,owner: mongoose.Types.ObjectId()});

  // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
  // when called. Then replaces the original implementation of the find method with the fake implementation.
  const findFake = sinon.stub(dashboard, 'find').throws(new Error('Internal server error occurred'));  
  const {statusCode} = await t.context.got(`dashboards/dashboards?token=${t.context.token}`);
  t.is(statusCode, 404);
  findFake.restore();
});

test('POST /create-dashboard error handler', async (t) => {
  // Create a new dashboard
  await dashboard.create({name: 'Test Dashboard',layout: [],items: {},nextId: 1,owner: mongoose.Types.ObjectId()});

  // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
  // when called. Then replaces the original implementation of the find method with the fake implementation.
  const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));
  const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
  const {statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${t.context.token}`,dashboardJson);
  t.is(statusCode, 404);
  findFake.restore();
});

test('POST /delete-dashboard error handler', async (t) => {
  // Create a new dashboard
  await dashboard.create({name: 'Test Dashboard',layout: [],items: {},nextId: 1,owner: mongoose.Types.ObjectId()});

  // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
  // when called. Then replaces the original implementation of the find method with the fake implementation.
  const findFake = sinon.stub(dashboard, 'findOneAndRemove').throws(new Error('Internal server error occurred'));
  const dashboardJson = {json: {name: 'Test Dashboard',id: t.context.token}};
  const {statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${t.context.token}`,dashboardJson);
  t.is(statusCode, 404);
  findFake.restore();
});

test('GET /dashboard error handler', async (t) => {
  // Create a new dashboard
  await dashboard.create({name: 'Test Dashboard',layout: [],items: {},nextId: 1,owner: mongoose.Types.ObjectId()});

  // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
  // when called. Then replaces the original implementation of the find method with the fake implementation.
  const findFake = sinon.stub(dashboard, 'findOne').throws(new Error('Internal server error occurred'));  
  const {statusCode} = await t.context.got(`dashboards/dashboard?token=${t.context.token}`);
  t.is(statusCode, 404);
  findFake.restore();
});