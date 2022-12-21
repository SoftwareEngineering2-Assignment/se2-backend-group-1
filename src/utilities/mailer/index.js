/*
* Import password and send from the same folder and export an object with properties, main (with value password) and send (with value send).
*/
const password = require('./password');
const send = require('./send');

module.exports = {
  mail: password,
  send
};
