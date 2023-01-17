require('dotenv').config();
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const app = require('../src/index');
const User = require('../src/models/user');

test.before(async (t) => {
    t.context.server = http.createServer(app);
    t.context.prefixUrl = await listen(t.context.server);
    t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});
  
test.after.always((t) => {
    t.context.server.close();
});

test.beforeEach(async t => {
    t.context.user = await User.create({
        username: 'username',
        password: 'password',
        email: 'email@example.com',
    });
});

test.afterEach.always(async t => {
    await User.deleteMany({});
});

//Test for /resetpassword user not found
test('POST /resetpassword user not found', async t => {
    const sourceJson = {json: {username: -1, password: "newpassword"}};
    const {body, statusCode} = await t.context.got.post(`users/resetpassword?`, sourceJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        status: 404,
        message: 'Resource Error: User not found.'
      });
});


// Test for /resetpassword to reset password
test('POST /resetpassword to reset password', async (t) => {
    const sourceJson = {json: {username: 'username'}};
    const {body, statusCode} = await t.context.got.post(`users/resetpassword?`, sourceJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        ok: true,
        message: 'Forgot password e-mail sent.'
      });
});