// Import express and initialize it, middlewares utilities and models.
const express = require('express');
const {validation, authorization} = require('../middlewares');
const {helpers: {jwtSign}} = require('../utilities/authentication');

const {mailer: {mail, send}} = require('../utilities');

const router = express.Router();

const User = require('../models/user');
const Reset = require('../models/reset');

/* 
* Handling POST requests and use a validation middleware. If it fails, send an appropriate response to the client and does not call the next middleware. 
* If it succeeds, call the next function in the chain.
* If an error occurs during the execution of the following routes handlers, it will pass control to the next middleware with the error 
* as an argument, for the error to be handled.
*/

/*
* Use async and extract the username, password and email from body and create a new user. Then find an existing user with the same username or email. 
* If a user is found, send a response with status code of 409 and a message indicating that the registration failed.
* If no user is found, create a new user and save him to the database. If it succeeds, send a response indicating that the registration was successful.
*/
router.post('/create',
  (req, res, next) => validation(req, res, next, 'register'),
  async (req, res, next) => {
    const {username, password, email} = req.body;
    try {
      const user = await User.findOne({$or: [{username}, {email}]});
      if (user) {
        return res.json({
          status: 409,
          message: 'Registration Error: A user with that e-mail or username already exists.'
        });
      }
      const newUser = await new User({
        username,
        password,
        email
      }).save();
      return res.json({success: true, id: newUser._id});
    } catch (error) {
      return next(error);
    }
  });


/*
* Use async and extract the username and password from body and create a new user. Then find an existing user with the same username or email. 
* If no user is found, send a response with status code of 401 and a message indicating that the user was not found.
* If a user is found, compare the password provided with the user's stored password.
* If the passwords do not match, send a response with status code of 401 and a message indicating that the passwords do not match. 
* If the passwords do match, generate a JSON Web Token (JWT) and send a response containing the user's details and the generated JWT.
*/
router.post('/authenticate',
  (req, res, next) => validation(req, res, next, 'authenticate'),
  async (req, res, next) => {
    const {username, password} = req.body;
    try {
      const user = await User.findOne({username}).select('+password');
      if (!user) {
        return res.json({
          status: 401,
          message: 'Authentication Error: User not found.'
        });
      }
      if (!user.comparePassword(password, user.password)) {
        return res.json({
          status: 401,
          message: 'Authentication Error: Password does not match!'
        });
      }
      return res.json({
        user: {
          username, 
          id: user._id, 
          email: user.email
        },
        token: jwtSign({username, id: user._id, email: user.email})
      });
    } catch (error) {
      return next(error);
    }
  });


/*
* Use async for password reset and extract the username from body and use to find a matching user in the database.
* If no user is found, send a response with status code of 404 and a message indicating that the user was not found.
* If a user is found, generate a new JSON Web Token (JWT), remove any existing password reset records for the user from the database 
* and create a new password reset record.
* Then send an email to the user's email address containing a link to reset their password using a custom mail function and a custom send function. 
*/  
router.post('/resetpassword',
  (req, res, next) => validation(req, res, next, 'request'),
  async (req, res, next) => {
    const {username} = req.body;
    try {
      const user = await User.findOne({username});
      if (!user) {
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      const token = jwtSign({username});
      await Reset.findOneAndRemove({username});
      await new Reset({
        username,
        token,
      }).save();

      const email = mail(token);
      send(user.email, 'Forgot Password', email);
      return res.json({
        ok: true,
        message: 'Forgot password e-mail sent.'
      });
    } catch (error) {
      return next(error);
    }
  });

/*
* Check whether the request contains a valid JSON Web Token (JWT) in the Authorization header and verifies it.
* If the JWT is not present or is invalid, send a response with status code of 401 and a message indicating that the request is unauthorized.
* If the JWT is present and valid, decode the JWT and add the decoded payload to the req.decoded, then call the next function.
* Use async to extract the password from body and the username from the decoded JWT in the req.decoded. Then use the username to find
* a matching user in the database.
* If none is found, send a response with status code of 404 and a message indicating that the user was not found.
* If one is found, find a matching password reset record in the database and remove it.
* If no matching password reset record is found, send a response with status code of 410 and a message indicating that the reset token has expired.
* If a matching password reset record is found, update the user's password with the new password provided in the request, save the updated user
* to the database and send a response indicating that the password was changed successfully.
*/
router.post('/changepassword',
  (req, res, next) => validation(req, res, next, 'change'),
  authorization,
  async (req, res, next) => {
    const {password} = req.body;
    const {username} = req.decoded;
    try {
      const user = await User.findOne({username});
      if (!user) {
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      const reset = await Reset.findOneAndRemove({username});
      if (!reset) {
        return res.json({
          status: 410,
          message: ' Resource Error: Reset token has expired.'
        });
      }
      user.password = password;
      await user.save();
      return res.json({
        ok: true,
        message: 'Password was changed.'
      });
    } catch (error) {
      return next(error);
    }
  });

// Export the router object, which makes it available for use in other parts of the application.
module.exports = router;
