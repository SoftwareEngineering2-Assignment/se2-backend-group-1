/*
* Ιmport jsonwebtoken in the object jwt.
*/
const jwt = require('jsonwebtoken');

/*
* Ιmport ramda in the objects:
* path, retrieves a value at a path or nested property in an object. It takes an array of keys as
* the first argument and an object as the second argument, and returns the value at the specified path in the object.

* ifElse, takes a predicate function, a function to execute if the predicate returns true and a 
* function to execute if the predicate returns false. It returns a new function that will take an argument, 
* apply the predicate to it, and then execute the appropriate function based on the result.

* isNil, returns true if its argument is null or undefined, and false otherwise.

* startsWith, returns true if a string starts with the characters specified in the second argument, and false otherwise.

* slice, returns a new array or string with a subset of the elements or characters from the original array or string. 
* It takes an index to start at and an index to end at (the end index is not included) as arguments.

* identity, returns its argument.

* pipe, composes multiple functions by performing them left-to-right. It takes a list of functions as its arguments
* and returns a new function that will take an argument, apply the first function to it, then apply the second function to the result,
* and so on until all the functions have been applied. The result of the final function is returned.
*/
const {path, ifElse, isNil, startsWith, slice, identity, pipe} = require('ramda');

 
/*
* Takes the value of the server secret from the .env.
*/
const secret = process.env.SERVER_SECRET;

/*
* A middleware function that checks the presence and validity of a token in a request. 
* It uses the pipe function to perform a series of operations on the request object, req.
*/
module.exports = (req, res, next) => {
  /**
     * @name authorization
     * @description Middleware that checks a token's presence and validity in a request
    */
  pipe(
    (r) =>
    /* 
    * Try to retrieve the token from the query parameter, the x-access-token header, or the authorization header, using the path function. 
    * If a token is found, it is passed to the next operation in the pipeline. If no token is found, null is passed to the next operation.
    */
      path(['query', 'token'], r)
          || path(['headers', 'x-access-token'], r)
          || path(['headers', 'authorization'], r),

    /* 
    * If the token is not null and starts with the string 'Bearer ', it slices the string to remove the 'Bearer ' prefix and trims
    * any whitespace on the left side of the string. If either condition is false, it returns the original token value.      
    */
    ifElse(
      (t) => !isNil(t) && startsWith('Bearer ', t),
      (t) => slice(7, t.length, t).trimLeft(),
      identity
    ),
    
    /* 
    * If the token is null, it calls the next function with an error object indicating that the token is missing. 
    * If the token is not null, it uses the jwt.verify function to verify the token. 
    * If the token is valid, it sets the decoded property on the req object to the decoded token and calls the next function.
    * If the token is invalid, it calls the next function  with an error object indicating that the token could not be verified.
    */
    ifElse(
      isNil,
      () =>
        next({
          message: 'Authorization Error: token missing.',
          status: 403
        }),
      (token) =>
        jwt.verify(token, secret, (e, d) =>
          ifElse(
            (err) => !isNil(err),
            (er) => {
              if (er.name === 'TokenExpiredError') {
                next({
                  message: 'TokenExpiredError',
                  status: 401,
                });
              }
              next({
                message: 'Authorization Error: Failed to verify token.',
                status: 403
              });
            },
            (_, decoded) => {
              req.decoded = decoded;
              return next();
            }
          )(e, d))
    )
  )(req);
};
