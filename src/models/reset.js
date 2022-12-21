/*
* Importing mongoose and a mongoose plugin for more user-friendly validation error messages when a unique constraint is violated.
* Also import an expire constant from the validation module in the utilities folder 
*/
/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {constants: {expires}} = require('../utilities/validation');

/*
* Define a Mongoose schema for a reset token document in a MongoDB database. The schema specifies the structure of the reset
* token document and includes information about the type,  required status, and default value of each field in the document.

* The fields are: username, token, and expiration date of the reset token. 
* The username is required, with lowercase, indexed as a string and it's unique.

* A token as a type of string is required.

* The expireAt is indexed, but the index is to expire after the number of seconds, according to the expire constant and 
* gets a default value of the current date and time, if it is not specified.
* This ensures that there are no duplicate reset tokens for the same username just because the capitalization is different.
*/
const ResetSchema = new mongoose.Schema({
  username: {
    index: true,
    type: String,
    required: true,
    unique: 'A token already exists for that username!',
    lowercase: true
  },
  token: {
    type: String,
    required: true
  },
  expireAt: {
    type: Date,
    default: Date.now,
    index: {expires},
  },
});

/*
* Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.
*/
ResetSchema.plugin(beautifyUnique);

/*
* Used to pluralize the name of a collection based on the given singular name, in this case it return null, because of the argument 
*/
mongoose.pluralize(null);

/*
* Export a Mongoose model based on the ResetSchema, which represents a collection in the MongoDB database that allows to perform CRUD 
* operations on the reset token documents in the collection.
*/
module.exports = mongoose.model('reset-tokens', ResetSchema);
