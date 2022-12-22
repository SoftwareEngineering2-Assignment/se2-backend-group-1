/*
* Import password and send from the same folder and export an object with properties, main (with value password) and send (with value send).
*/
const password = require('./password');
const send = require('./send');

/*
* Export an object with the mail with the value of password and send.
*/
module.exports = {
  mail: password,
  send
};
