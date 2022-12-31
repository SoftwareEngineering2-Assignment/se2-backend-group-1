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
});

test.afterEach.always(async t => {
  await t.context.dashboard.delete(); // Delete the dashboard 
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

  t.is(statusCode, 200);
  t.assert(body.success);
  t.is(typeof body.dashboards, 'object');
  t.is(body.dashboards.length, 0);
});


// test('GET /dashboards throws error on invalid token', async t => {
//   const token = jwtSign({id: 'hello'}); // use invalid id
//   const error = await t.throwsAsync(async () => {
//     await t.context.got(`dashboards/dashboards?token=${token}`, { throwHttpErrors: true });
//   });
//   console.log(error);
//   t.is(error.statusCode, 500);
//   t.truthy(error.body.error);
// });



/*
* Tests for create-dashboard
*/
test('POST /create-dashboard return correct statusCode and success', async t => {
  const dasboard = {json: {name: t.context.dashboard,id: t.context.token}};
  const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${t.context.token}`,dasboard);

  t.is(statusCode, 200);
  t.assert(body.success);
});



// test('POST /create-dashboard with duplicate name', async t => {
//   const token = jwtSign({id: "41"});
//   const dasboard = {json: {name: t.context.dashboard,id: 2}};
//   const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,dasboard);

//   t.is(statusCode, 200);
//   t.is(body.status, 409);
//   // t.deepEqual(body, {status: 409,message: 'A dashboard with that name already exists.'});
// });





/*
* Tests for delete-dashboard
*/
test('POST /delete-dashboard return correct statusCode and success', async t => {
  const dasboard = {json: {token: t.context.token,id: t.context.dashboard._id}};
  const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${t.context.token}`,dasboard);

  t.is(statusCode, 200);
  t.assert(body.success);
});


// test('POST /delete-dashboard with invalid id', async t => {
//   const token = t.context.token;
//   const dasboard = {json: {token: token,id: mongoose.Types.ObjectId(t.context.dashboard._id)}};
//   const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,dasboard);

//   t.is(statusCode, 200);
//   t.is(body.status, 409);
//   t.deepEqual(body, {status: 409,message: 'The selected dashboard has not been found.'});
// });




/*
* Tests for dashboard
*/
test('GET /dashboard return correct statusCode and body', async t => {
  const id = t.context.dashboard.id;
  const { body, statusCode } = await t.context.got(`dashboards/dashboard?id=${id}&token=${t.context.token}`);

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

  t.is(statusCode, 200);
  t.is(body.status, 409);
  t.deepEqual(body, {status: 409,message: 'The selected dashboard has not been found.'});
});



/*
* Tests for save-dashboard
*/
test('POST /save-dashboard return correct statusCode and body', async t => {
  const dasboard = {json: {id: t.context.dashboard._id, layout: {}, items: [], nextId: 1}};
  const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${t.context.token}`,dasboard);

  t.is(statusCode, 200);
  t.assert(body.success);
});

test('POST /save-dashboard with invalid id return correct statusCode, body and message', async t => {
  const dasboard = {json: {id: 1, layout: {}, items: [], nextId: 1}};
  const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${t.context.token}`,dasboard);

  t.is(statusCode, 200);
  t.is(body.status, 409);
  t.is(body.message, 'The selected dashboard has not been found.');
});



