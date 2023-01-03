require('dotenv').config();
process.env.PORT = 3001;
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const mongoose = require('mongoose');
const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const sources = require('../src/models/source');
const user = require('../src/models/user'); //?
//const sinon = require('sinon'); 
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
  t.context.sources = new sources({name: "Test_Sources", owner: mongoose.Types.ObjectId(),
                                  type: "Test_Type", url: "Test_Url", login: "Test_Login", 
                                  passcode: "Test_Passcode", vhost: "Test_Vhost"});
  await t.context.sources.save(); // Save it
  t.context.token = jwtSign({id: t.context.sources.owner});

  // Clear history
  //sinon.resetHistory();
  //sinon.restore();
  //sinon.reset();
});

test.afterEach.always(async t => {
  await t.context.sources.delete(); // Delete the source 
  user.findByIdAndDelete(user._id);
});


/*
* Tests for get /sources. One test for a correct given token, one for a token with no sources in it
* and one for when an error happens.  
*/
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


/*
* Tests for create-source
*/
test('POST /create-source return correct statusCode and success', async t => {
  const sourceJson = {json: {name: t.context.sources,id: t.context.token}};
  const {body, statusCode} = await t.context.got.post(`sources/create-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /create-source with duplicate name', async t => {
  const sourceJson = {json: {name: t.context.sources.name,id: t.context.token}};
  const {body, statusCode} = await t.context.got.post(`sources/create-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409,message: 'A source with that name already exists.'});
});


/*
* Tests for change-source
*/
// test('POST /change-source return correct statusCode and success', async t => {
//   const sourceJson = {json: {token: t.context.token,id: t.context.sources._id}};
//   const {body, statusCode} = await t.context.got.post(`sources/change-source?token=${t.context.token}`,sourceJson);

//   // Test for the correct values
//   t.is(statusCode, 200);
//   t.assert(body.success);
// });


/*
* Tests for delete-source
*/
test('POST /delete-source return correct statusCode and success', async t => {
  const sourceJson = {json: {token: t.context.token,id: t.context.sources._id}};
  const {body, statusCode} = await t.context.got.post(`sources/delete-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.assert(body.success);
});


test('POST /delete-source with invalid id', async t => {

  const sourceJson = {json: {token: 1,id: 1}};
  const {body, statusCode} = await t.context.got.post(`sources/delete-source?token=${t.context.token}`,sourceJson);

  // Test for the correct values
  t.is(statusCode, 200);
  t.deepEqual(body, {status: 409,message: 'The selected source has not been found.'});
});



