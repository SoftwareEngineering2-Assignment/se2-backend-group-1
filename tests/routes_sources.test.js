/*
* Import the necessery modules for the tests.
*/  
require('dotenv').config();
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const mongoose = require('mongoose');
const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const sources = require('../src/models/source');
const user = require('../src/models/user'); 

// Creates an HTTP, which is an Express application.
// Returns promise resolves to the prefixUrl variable.
// Extended with options for HTTP2, error handling, JSON response type and the prefixUrl variable.
test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

// Closes the server
test.after.always((t) => {
  t.context.server.close();
});

// Before each test create a source
test.beforeEach(async t => {
  // Create a source
  t.context.sources = new sources({name: "Test_Sources", owner: mongoose.Types.ObjectId(),
  type: "Test_Type", url: "Test_Url", login: "Test_Login", 
  passcode: "Test_Passcode", vhost: "Test_Vhost"});
  await t.context.sources.save(); // Save it
  t.context.token = jwtSign({id: t.context.sources.owner});
});

// After each test delete sources and user
test.afterEach.always(async t => {
  await t.context.sources.delete(); // Delete the source 
  user.findByIdAndDelete(user._id);
});

// Tests for get /sources. One test for a correct given token, one for a token with no sources in it and one for when an error happens.  
test('GET /sources returns correct response and status code', async (t) => {
  const {body, statusCode} = await t.context.got(`sources/sources?token=${t.context.token}`);
  t.is(statusCode, 200);
  t.assert(body.success);
  t.is(typeof body.sources[body.sources.length-1], 'object'); // We check if the last value of the array is an object
  t.assert(body.sources[body.sources.length-1].id); // We check if the id exists

  // We want to check if the correct value has been registered in the last index of the array body.sources
  t.deepEqual(body.sources[body.sources.length -1], {active: false, id:body.sources[body.sources.length-1].id, name: "Test_Sources",
    type: "Test_Type", url: "Test_Url", login: "Test_Login", 
    passcode: "Test_Passcode", vhost: "Test_Vhost"}
    )
});

test('GET /sources with no sources return correct response and status code and type', async t => {
  // Create one empty source to see if it's accurate
  const token = jwtSign({id: mongoose.Types.ObjectId()});
  const {body, statusCode} = await t.context.got(`sources/sources?token=${token}`);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
  t.is(typeof body.sources, 'object');
  t.is(body.sources.length, 0);
});

// Tests for create-source
test('POST /create-source return correct statusCode and success', async t => {
  const sourceJson = {json: {name: "new Source",id: t.context.sourcesid}};
  const {body, statusCode} = await t.context.got.post(`sources/create-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /create-source with duplicate name', async t => {
  const sourceJson = {json: {name: t.context.sources.name,id: t.context.sources.id}};
  const {body, statusCode} = await t.context.got.post(`sources/create-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409,message: 'A source with that name already exists.'});
});

// Tests for change-source 
test('POST /change-source return correct statusCode and success', async t => {
  const sourceJson = {json: {id: t.context.sources.id, name: "new name", 
    type: "new type", url: "new url", login: "new login", 
    passcode: "new passcode", vhost: "new vhost"}};
    const {body, statusCode} = await t.context.got.post(`sources/change-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /change-source with invalid id', async t => {
  const sourceJson = {json: {id: 1, name: "new name", 
  type: "new type", url: "new url", login: "new login", 
  passcode: "new passcode", vhost: "new vhost"}};
  const {body, statusCode} = await t.context.got.post(`sources/change-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {
    status: 409,
    message: 'The selected source has not been found.'
  });
});

test('POST /change-source with same name', async t => {
  t.context.sources2 = new sources({name: "Name_Already_Exist", owner: t.context.sources.owner,
  type: "Test_Type", url: "Test_Url", login: "Test_Login", 
  passcode: "Test_Passcode", vhost: "Test_Vhost"});
  await t.context.sources2.save(); // Save it
  const sourceJson = {json: {id: t.context.sources.id, name: "Name_Already_Exist", 
    type: t.context.sources.type, url: t.context.sources.url, login: t.context.sources.login, 
    passcode: t.context.sources.passcode, vhost: t.context.sources.vhost}};
  const {body, statusCode} = await t.context.got.post(`sources/change-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {
    status: 409,
    message: 'A source with the same name has been found.'
  });
});

// Tests for delete-source
test('POST /delete-source return correct statusCode and success', async t => {
  const sourceJson = {json: {id: t.context.sources.id}};
  const {body, statusCode} = await t.context.got.post(`sources/delete-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /delete-source with invalid id', async t => {
  const sourceJson = {json: {id: 1}};
  const {body, statusCode} = await t.context.got.post(`sources/delete-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409,message: 'The selected source has not been found.'});
});

// Tests for source if we found the selected source
test('POST /source return correct statusCode and body', async t => {
  const sourceJson = {json: { name:  t.context.sources.name, owner: t.context.sources.owner, user: {id: 1}}};
  const { body, statusCode } = await t.context.got.post(`sources/source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
  t.deepEqual(body.source, {login: t.context.sources.login, passcode: t.context.sources.passcode, 
              type: t.context.sources.type, url: t.context.sources.url, vhost: t.context.sources.vhost});
});

// Tests for source if the  selected source has not been found
test('POST /source source not found', async t => {
  const sourceJson = {json: { name:  t.context.sources.name, owner: "self", user: {id: 1}}};
  const { body, statusCode } = await t.context.got.post(`sources/source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409,message: 'The selected source has not been found.'});
});

// Testsfor check-sources. In order to check all the if statments we pass 2 elemnets in the array
test('POST /check-sources return correct statusCode and success', async t => {
  const sourceJson = {json: { sources: ["TEST", t.context.sources.name] }};
  const {body, statusCode } = await t.context.got.post(`sources/check-sources?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.is(body.newSources[0], "TEST");
});