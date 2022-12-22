/* eslint-disable no-console */
// Import ramda. 
const {pipe, has, ifElse, assoc, identity, allPass, propEq} = require('ramda');

/* 
* Function that takes an object as an argument and returns a modified version of it. If the status property of the object is 500 and 
* the NODE_ENV environment variable is set to production, then the function will return a new object that is the same as the original
* object but with a new property called message set to a string. If either of these conditions is not met,
* then the function will return the original object unmodified.
*/
const withFormatMessageForProduction = ifElse(
  allPass([propEq('status', 500), () => process.env.NODE_ENV === 'production']),
  assoc('message', 'Internal server error occurred.'),
  identity
);

/*
* Export a module that: creates error object and copy the properties to a new object. If the object has a property called status, then returned it
* unmodified. If it does not, then a new object is created, which is a copy of the original object with the status property set to 500.
* Then format the message and finally sends the modified error object as a JSON response to the client and send JSON-formatted error as the body.
*/
module.exports = (error, req, res, next) => 
  /**
     * @name error
     * @description Middleware that handles errors
     */
  pipe(
    (e) => ({...e, message: e.message}),
    ifElse(has('status'), identity, assoc('status', 500)),
    withFormatMessageForProduction,
    (fError) => res.status(fError.status).json(fError)
  )(error);
