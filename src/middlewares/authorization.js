/*
* Ιmport jsonwebtoken and ramda and seperate it's values.
*/
const jwt = require('jsonwebtoken');
const {path, ifElse, isNil, startsWith, slice, identity, pipe} = require('ramda');

// Takes the secret from the .env.
const secret = process.env.SERVER_SECRET;

/* Export a module
    * If the token is null, it calls the next function with an error object indicating that the token is missing. 
    * If the token is not null, it uses the jwt.verify function to verify the token. 
    * If the token is valid, it sets the decoded property on the req object to the decoded token and calls the next function.
    * If the token is invalid, it calls the next function  with an error object indicating that the token could not be verified.
  
    * If the token is null, it calls the next function with an error object indicating that the token is missing. 
    * If the token is not null, it uses the jwt.verify function to verify the token. 
    * If the token is valid, it sets the decoded property on the req object to the decoded token and calls the next function.
    * If the token is invalid, it calls the next function  with an error object indicating that the token could not be verified.
 
    * If the token is null, it calls the next function with an error object indicating that the token is missing. 
    * If the token is not null, it uses the jwt.verify function to verify the token. 
    * If the token is valid, it sets the decoded property on the req object to the decoded token and calls the next function.
    * If the token is invalid, it calls the next function  with an error object indicating that the token could not be verified.
 */
module.exports = (req, res, next) => {
  /**
     * @name authorization
     * @description Middleware that checks a token's presence and validity in a request
    */
  pipe(
    (r) =>
      path(['query', 'token'], r)
          || path(['headers', 'x-access-token'], r)
          || path(['headers', 'authorization'], r),

    ifElse(
      (t) => !isNil(t) && startsWith('Bearer ', t),
      (t) => slice(7, t.length, t).trimLeft(),
      identity
    ),
    
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
