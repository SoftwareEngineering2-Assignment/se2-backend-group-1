/*
* Importing the validation module from utilities and exports an object with a schemas property.
*/
const {schemas: validationSchemas} = require('../utilities/validation');

/* 
* Middleware is used to validate the request body of an HTTP request against a specified schema before the request is passed 
* on to the next middleware or the route handler, for ensuring that the request body conforms to a certain structure or contains certain data.
*/ 
module.exports = async (req, res, next, schema) => {
  /**
     * @name validation
     * @description Middleware that tests the validity of a body given a specified schema
     */
  try {
    /* 
    * Get the body property from the req object, which contains the request body of an HTTP request, then it validates 
    * the body against a schema and finally it calls next function, so that 
    * the middleware chain continues to the next middleware, if it doesn't throw an error.
    */
    const {body} = req;
    await validationSchemas[schema].validate(body);
    next();

    /* 
    * If the validate method throws an error, it calls the next function with an object containing a message and a 
    * status code, by skipping any remaining middleware and move on to the error-handling middleware.
    */
  } catch (err) {
    next({
      message: `Validation Error: ${err.errors[0]}`,
      status: 400
    });
  }
};
