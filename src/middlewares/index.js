/*
* Importing the authorization, error and validation files
*/
const authorization = require('./authorization');
const error = require('./error');
const validation = require('./validation');

/*
* This code exports an object with three properties: authorization, error, and validation.
*/
module.exports = {
  authorization,
  error,
  validation,
};
