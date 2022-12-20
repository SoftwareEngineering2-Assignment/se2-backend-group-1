/* eslint-disable no-console */
/*
* The documentation of this line is written in /src/middlewares/authentication.js, 
* because it's a big documentation there is no reason to have a duplicate one.
*/ 
const {pipe, has, ifElse, assoc, identity, allPass, propEq} = require('ramda');

/* 
* Function  that takes an object as an argument and returns a modified version of it:

* If the status property of the object is 500 and the NODE_ENV environment variable is set to production, 
* then the function will return a new object that is the same as the original object but with a new property called message 
* set to the string 'Internal server error occurred.'.

* If either of these conditions is not met, then the function will return the original object unmodified.

* It takes three arguments: 

* The allPass function, which returns a new function that returns true if all of the functions in the array return true when called with the same argument.

* The assoc function creates a new object that is a copy of the original object with a specified property set to a new value.

* The identity function, which returns its argument unmodified (the original object), ff either of the conditions is not met.
*/
const withFormatMessageForProduction = ifElse(
  allPass([propEq('status', 500), () => process.env.NODE_ENV === 'production']),
  assoc('message', 'Internal server error occurred.'),
  identity
);

/*
* This is an error-handling middleware function, with arguments, an error object, an req object representing the incoming HTTP request, 
* a res object representing the outgoing HTTP response, and a next function that is called to pass control to the next middleware in the chain.
*/
module.exports = (error, req, res, next) => 
  /**
     * @name error
     * @description Middleware that handles errors
     */
    
  /*
  * The first function creates a new object based on the error object, using the spread operator (...) to copy the properties of the error object to a new object.

  * If the object has a property called status, then the object is returned unmodified by calling the identity function. If it does not, then a new object
  * is created using the assoc function, which is a copy of the original object with the status property set to 500.

  * Then then the withFormatMessageForProduction function is called.

  * Finally fError sends the modified error object as a JSON response to the client. The status method sets the HTTP status code of the response,
  * and the json method sends the JSON-formatted error object as the response body.
  */  
  pipe(
    (e) => ({...e, message: e.message}),
    ifElse(has('status'), identity, assoc('status', 500)),
    withFormatMessageForProduction,
    (fError) => res.status(fError.status).json(fError)
  )(error);
