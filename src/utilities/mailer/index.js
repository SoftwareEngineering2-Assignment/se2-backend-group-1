/*
* Import password and send and export them (with mail == password).
*/
const password = require('./password');
const send = require('./send');

module.exports = {
  mail: password,
  send
};
