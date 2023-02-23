/*
* Import the necessery modules for the tests.
*/  
require('dotenv').config();
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const sinon = require('sinon');
const app = require('../src/index'); 
const Source  = require('../src/models/source');
const mongoose = require('mongoose');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const User = require('../src/models/user'); 
let user;

// Creates an HTTP, which is an Express application.
// Returns promise resolves to the prefixUrl variable.
// Extended with options for HTTP2 support, error handling, JSON response type and the prefixUrl variable.
// Finally creates a user
test.before(async (t) => {
    t.context.server = http.createServer(app);
    t.context.prefixUrl = await listen(t.context.server);
    t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
    user = await User.create({
        username: 'username',
        password: 'password',
        email: 'email@example.com',
      });
    });

// Closes the server and delets all the users
test.after.always((t) => {
    t.context.server.close();
    User.deleteMany({}, function(err){}); 
});

// Before each test create a source and clear history of sinon
test.beforeEach(async t => {
    // Create a source
    t.context.source = new Source({name: "Test_source", owner: mongoose.Types.ObjectId(),
    type: "Test_Type", url: "Test_Url", login: "Test_Login", 
    passcode: "Test_Passcode", vhost: "Test_Vhost"});
    await t.context.source.save(); // Save it
    t.context.token = jwtSign({id: t.context.source.owner});

    // Clear history
    sinon.resetHistory();
    sinon.restore();
    sinon.reset();
});
 
// After each test delete sources
test.afterEach.always(async t => {
    await t.context.source.delete(); // Delete the source 
});

// Testing general/statistics error handler  (it throws an error with .stub and i dont know how to fix it)
test('GET /statistics error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source , 'countDocuments').throws(new Error('Internal server error occurred'));  
    const {statusCode} = await t.context.got(`general/statistics`);
    t.is(statusCode, 500);
    findStub.restore();
});

// Testing source/sources error handler
test('GET /sources error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'find').throws(new Error('Internal server error occurred'));  
    const {statusCode} = await t.context.got(`sources/sources?token=${t.context.token}`);
    t.is(statusCode, 500);
    findStub.restore();
});
  
// Testing source/create-source error handler
test('POST /create-source error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source", id: t.context.sourcesid}};
    const {statusCode} = await t.context.got.post(`sources/create-source?token=${t.context.token}`,sourceJson);

    t.is(statusCode, 500);
    findStub.restore();
});

// Testing source/change-source error handler
test('POST /change-source error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source", id: t.context.sourcesid}};
    const {statusCode} = await t.context.got.post(`sources/change-source?token=${t.context.token}`,sourceJson);

    t.is(statusCode, 500);
    findStub.restore();
});

// Testing source/delete-source error handler
test('POST /delete-source error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOneAndRemove').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source", id: t.context.sourcesid}};
    const {statusCode} = await t.context.got.post(`sources/delete-source?token=${t.context.token}`,sourceJson);
    t.is(statusCode, 500);
    findStub.restore();
});

// Testing source/source error handler
test('POST /source error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source", id: t.context.sourcesid}};
    const {statusCode } = await t.context.got.post(`sources/source?token=${t.context.token}`,sourceJson);
    t.is(statusCode, 500);
    findStub.restore();
});

// Testing source/check-sources error handler
test('POST /check-sources error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source", id: t.context.sourcesid}};
    const {statusCode } = await t.context.got.post(`sources/check-sources?token=${t.context.token}`,sourceJson);

    t.is(statusCode, 500);
    findStub.restore();
});

// Testing users/create error handler
test('POST /create error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(User, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {username: 'newuser1', password: 'newpassword1', email: 'newuser1@example.com'}};
    const {statusCode} = await t.context.got.post(`users/create?`, sourceJson);
    
    t.is(statusCode, 500);
    findStub.restore();
});

// Testing users/authenticate error handler
test('POST /authenticate error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(User, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {username: 'newuser1', password: 'newpassword1', email: 'newuser1@example.com'}};
    const {statusCode} = await t.context.got.post(`users/authenticate?`, sourceJson);
    
    t.is(statusCode, 500);
    findStub.restore();
});

// Testing users/resetpassword error handler
test('POST /resetpassword error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(User, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {username: 'newuser1', password: 'newpassword1', email: 'newuser1@example.com'}};
    const {statusCode} = await t.context.got.post(`users/resetpassword?`, sourceJson);
    
    t.is(statusCode, 500);
    findStub.restore();
});

// Testing users/changepassword error handler
test('POST /changepassword error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(User, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json:{ password: "200oakdf"}};
    token = jwtSign({username: user.username});
    const {statusCode} = await t.context.got.post(`users/changepassword?token=${token}`, sourceJson);
    
    t.is(statusCode, 500);
    findStub.restore();
});
