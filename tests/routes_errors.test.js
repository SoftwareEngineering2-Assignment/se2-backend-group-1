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
const user = require('../src/models/user'); 

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
});

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
  
test.afterEach.always(async t => {
    await t.context.source.delete(); // Delete the source 
    user.findByIdAndDelete(user._id);
});

// Testing general/statistics error handler  (it throws an error with .stub and i dont know how to fix it)
test('GET /statistics error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source , 'countDocuments').throws(new Error('Internal server error occurred'));  
    const {statusCode} = await t.context.got(`general/statistics`);
    t.is(statusCode, 404);
    findStub.restore();
});

// Testing source/sources error handler
test('GET /sources error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'find').throws(new Error('Internal server error occurred'));  
    const {statusCode} = await t.context.got(`sources/sources?token=${t.context.token}`);
    t.is(statusCode, 404);
    findStub.restore();
});
  
// Testing source/create-source error handler
test('POST /create-source error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source",id: t.context.sourcesid}};
    const {statusCode} = await t.context.got.post(`sources/create-source?token=${t.context.token}`,sourceJson);

    t.is(statusCode, 404);
    findStub.restore();
});

// Testing source/change-source error handler
test('POST /change-source error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source",id: t.context.sourcesid}};
    const {statusCode} = await t.context.got.post(`sources/change-source?token=${t.context.token}`,sourceJson);

    t.is(statusCode, 404);
    findStub.restore();
});

// Testing source/delete-source error handler
test('POST /delete-source error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOneAndRemove').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source",id: t.context.sourcesid}};
    const {statusCode} = await t.context.got.post(`sources/delete-source?token=${t.context.token}`,sourceJson);
    t.is(statusCode, 404);
    findStub.restore();
});

// Testing source/source error handler
test('POST /source error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source",id: t.context.sourcesid}};
    const {statusCode } = await t.context.got.post(`sources/source?token=${t.context.token}`,sourceJson);
    t.is(statusCode, 404);
    findStub.restore();
});

// Testing source/check-sources error handler
test('POST /check-sources error handler', async (t) => {
    // Creates a fake implementation of the find method of the dashboard object that throws an error with a message
    // when called. Then replaces the original implementation of the find method with the fake implementation.
    const findStub = sinon.stub(Source, 'findOne').throws(new Error('Internal server error occurred'));  
    const sourceJson = {json: {name: "new Source",id: t.context.sourcesid}};
    const {statusCode } = await t.context.got.post(`sources/check-sources?token=${t.context.token}`,sourceJson);

    t.is(statusCode, 404);
    findStub.restore();
});
