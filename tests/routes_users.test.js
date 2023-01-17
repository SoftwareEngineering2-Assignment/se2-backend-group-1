require('dotenv').config();
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const app = require('../src/index');
const User = require('../src/models/user');
const sinon = require('sinon');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const {mongoose} = require('../src/config');

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

// Tests for /create for a new user
test('POST /create Create new user', async t => {
    const sourceJson = {json: {username: 'newuser', password: 'newpassword', email: 'newuser@example.com'}};
    const {body, statusCode} = await t.context.got.post(`users/create?`, sourceJson);
    t.is(statusCode, 200);
    t.assert(body.success);
    t.assert(body.id);

    // Find the user with that name and password
    // const user = await User.findOne({username: 'newuser'}).select('+password');
    // t.assert(user);
    // t.is(user.email, 'newuser@example.com');
});

// Test for /create for a user with an existing email
test('POST /create Error creating a user with existing email', async t => {
    user1 = await User({username: 'newuser2',password: 'newpassword2', email: 'newuser2@example.com'}).save();
    const sourceJson = {json: {username: 'newuser22', password: 'newpassword2', email: 'newuser2@example.com'}};
    const {body, statusCode} = await t.context.got.post(`users/create?`, sourceJson);
    t.is(statusCode, 200);
    t.is(body.status, 409);
    t.is(body.message, 'Registration Error: A user with that e-mail or username already exists.');
});

// Test for /create for a user with an existing username
test('POST /create Error creating a user with existing username', async t => {
    user1 = await User({username: 'newuser3',password: 'newpassword3', email: 'newuser3@example.com'}).save();
    const sourceJson = {json: {username: 'newuser3', password: 'newpassword33', email: 'newuser33@example.com'}};
    const {body, statusCode} = await t.context.got.post(`users/create?`, sourceJson);
    t.is(statusCode, 200);
    t.is(body.status, 409);
    t.is(body.message, 'Registration Error: A user with that e-mail or username already exists.');
});

//Test for /authenticate to authenticate a user
test('POST /authenticate Authenticate the user', async t => {
    const sourceJson = {json: {username: 'username', password: 'password'}};
    const {body, statusCode} = await t.context.got.post(`users/authenticate?`, sourceJson);

    t.is(statusCode, 200);
    t.assert(body.token);
});

//Test for /authenticate user not found
test('POST /authenticate user not found', async t => {
    const sourceJson = {json: {username: -1, password: 'password'}};
    const {body, statusCode} = await t.context.got.post(`users/authenticate?`, sourceJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {status: 401,
    message: 'Authentication Error: User not found.'});
});

//Test for /authenticate password not match
test('POST /authenticate password not match', async t => {
    const sourceJson = {json: {username: 'username', password: "-1-1-1"}};
    const {body, statusCode} = await t.context.got.post(`users/authenticate?`, sourceJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        status: 401,
        message: 'Authentication Error: Password does not match!'
      });
});

// Test for /changepassword for change password
// test('POST /changepassword for change password', async t => {
//     const sourceJson = {json:{ password: "200oakdf"}};
//     token = jwtSign({username: 'username'});
//     const {body, statusCode} = await t.context.got.post(`users/changepassword?token=${token}`, sourceJson);
//     t.is(statusCode, 200);
//     t.deepEqual(body, {
//         ok: true,
//         message: 'Password was changed.'
//       });
// });
  
test('POST /changepassword returns correct response and status code when password changes successfully', async (t) => {
    let user5;
    user5 = await User({username: 'newuser5',password: 'newpassword5', email: 'newuser5@example.com'}).save();
    const token = jwtSign({username : user5.username});
    const sourceJson = {json: {password: 'password2000'}};
    const {body,statusCode} = await t.context.got.post(`users/changepassword?token=${token}`,sourceJson);
    t.is(statusCode,200);
    t.deepEqual(body, {
        status: 410,
        message: ' Resource Error: Reset token has expired.'
        });
});

// Test for /changepassword user not found
test('POST /changepassword user not found', async t => {
    const sourceJson = {json: {username: t.context.user.username, password: t.context.user.password}};
    t.context.token = jwtSign({id: -1});
    const {body, statusCode} = await t.context.got.post(`users/changepassword?token=${t.context.token}`, sourceJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        status: 404,
        message: 'Resource Error: User not found.'
  });
});

// Test for /changepassword token has expired
test('POST /changepassword token has expired', async t => {
    const sourceJson = {json: {username: -1, password: t.context.user.password}};
    t.context.token = jwtSign({username: t.context.user.username, password: t.context.user.password, email: t.context.user.email});
    const {body, statusCode} = await t.context.got.post(`users/changepassword?token=${t.context.token}`, sourceJson);
    t.is(statusCode, 200);
    t.deepEqual(body, {
        ok: true,
        message: 'Password was changed.'
    });
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