/*
* Import ramda, jsonwebtoken and bcryptjs
*/
const {genSaltSync, hashSync, compareSync} = require('bcryptjs');
const {sign} = require('jsonwebtoken');
const {pipe} = require('ramda');

/*
* Export 3 functions:

* passwordDigest, hashes a password using the bcrypt library. It takes a password and an optional salt work factor as input and returns
* the hashed password. 
* 'salt' is set to 10 and determines the computational cost of generating the salt. Increasing the number means that the hashing process will be slower and more secure,
* but also requires more resources.

* comparePassword, compares a text with a hashed password and returns a boolean indicating whether the two passwords match.

* jwtSign, signs a JSON web token (JWT) with a given payload and the server secret. The server secret is a string that is used to sign the JWT
* and should be kept secret.
*/
module.exports = {
  /**
     * @name passwordDigest
     * @description Is used to hash the password before saving it to the db
     */
  passwordDigest: (password, saltWorkFactor = 10) =>
    pipe(
      genSaltSync,
      (salt) => hashSync(password, salt)
    )(saltWorkFactor),

  /**
     * @name comparePassword
     * @description Is used to compare password with hash
     */
  comparePassword: (password, hash) => compareSync(password, hash),
  
  /**
     * @name jwtSign
     * @description Is used to sign jwt with payload (after authenticate)
     */
  jwtSign: (payload) => sign(payload, process.env.SERVER_SECRET),
};
