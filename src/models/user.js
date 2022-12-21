/*
* Importing mongoose and a mongoose plugin for more user-friendly validation error messages when a unique constraint is violated.
* Also having a hashed secure password and a comparePassword function for comparing a user-provided password to a previously-hashed password,
* from the authentication module in the utilities folder. 
* Finally import a min constant from the validation module in the utilities folder.
*/
/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {passwordDigest, comparePassword} = require('../utilities/authentication/helpers');
const {constants: {min}} = require('../utilities/validation');

/*
* Used to pluralize the name of a collection based on the given singular name, in this case it return null, because of the argument. 
*/
mongoose.pluralize(null);

/*
* Define a Mongoose schema for a Source model with fields email, username, password and registrationData.
* Email, username and password are strings and required. Email and username are required and indexed. Email also uses lowercase 
* and password has select equal to false, which means it should not be included in the results of the query by default.
* RegistrationData is a number field.
*/
const UserSchema = new mongoose.Schema(
  {
    email: {
      index: true,
      type: String,
      unique: 'A user already exists with that email!',
      required: [true, 'User email is required'],
      lowercase: true
    },
    username: {
      index: true,
      type: String,
      unique: 'A user already exists with that username!',
      required: [true, 'Username is required'],
    },
    password: {
      type: String,
      required: [true, 'User password is required'],
      select: false,
      minlength: min
    },
    registrationDate: {type: Number}
  }
);

/*
* Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.
*/
UserSchema.plugin(beautifyUnique);

/*
* Pre save hook that hashes passwords
*/
UserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = passwordDigest(this.password);
  }
  if (this.isModified('email') || this.isModified('username')) {
    this.registrationDate = Date.now();
  }
  return next();
});

/*
* Model method that compares hashed passwords
*/
UserSchema.methods.comparePassword = function (password) {
  return comparePassword(password, this.password);
};

/*
* Export a Mongoose model based on the UserSchema schema, which will be named users, and it can perform CRUD operations
* on documents in the collection.
*/
module.exports = mongoose.model('users', UserSchema);
