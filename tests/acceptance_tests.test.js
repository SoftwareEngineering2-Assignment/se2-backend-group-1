require('dotenv').config();
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const app = require('../src/index');
const User = require('../src/models/user'); 
let user;

// Creates an HTTP using the app, which is an Express application.
// Return promise resolves to the prefixUrl variable.
// Extended with options for HTTP2, error handling, JSON response type and the prefixUrl variable.
// Finally create a user.
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

// Server closure and deletes the users
test.after.always((t) => {
    t.context.server.close();
    User.deleteMany({},function(err){}); 
});

// User authentication acceptance test: Tests the ability of the backend to authenticate users by verifying that
// a user can successfully log in with their credentials.
test('User authentication acceptance test: Login with correct credentials should return a JWT token', async (t) => {
    const credentials = {json: {username: 'username', password: 'password'}};
    const {body, statusCode} = await t.context.got.post(`users/authenticate?`, credentials);

    t.is(statusCode, 200);
    t.assert(body.token);
});

// User management acceptance test: Tests the ability of the backend to create, read, update and delete user accounts.
test('POST /create Create new user', async t => {
    const credentials = {json: {username: 'newuser', password: 'newpassword', email: 'newuser@example.com'}};
    const {body, statusCode} = await t.context.got.post(`users/create?`, credentials);
    t.is(statusCode, 200);
    t.assert(body.success);
    t.assert(body.id);

    // Find the user with that name and password
    const user = await User.findOne({username: 'newuser'}).select('+password');
    t.assert(user);
    t.is(user.email, 'newuser@example.com');
    t.is(user.username, 'newuser');
});
