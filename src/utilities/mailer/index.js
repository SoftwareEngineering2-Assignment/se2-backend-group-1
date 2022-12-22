/*
* Import password and send.
*/
const password = require('./password');
const send = require('./send');

// Export an object with the mail with the value of password and send.
module.exports = {
  mail: password,
  send
};
