/*
* Importing the authorization, error and validation and export them.
*/
const authorization = require('./authorization');
const error = require('./error');
const validation = require('./validation');

module.exports = {
  authorization,
  error,
  validation,
};
