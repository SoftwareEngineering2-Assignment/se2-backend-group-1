/*
* Importing mongoose and a mongoose plugin for more user-friendly validation error messages when a unique constraint is violated.
*/
/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

/*
* Used to pluralize the name of a collection based on the given singular name, in this case it return null, because of the argument. 
*/
mongoose.pluralize(null);

/*
* Define a Mongoose schema for a Source model with fields name, type, url, login, passcode, vhost, owner, createdAt. 
* Name is a string, which is indexed and a required.
* Type, url, login, passcode and vhost are string fields.
* Owner is an objectId field that is a reference to a User document.
* CreatedAt is a date field.
*/
const SourceSchema = new mongoose.Schema(
  {
    name: {
      index: true,
      type: String,
      required: [true, 'Source name is required']
    },
    type: {type: String},
    url: {type: String},
    login: {type: String},
    passcode: {type: String},
    vhost: {type: String},
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {type: Date}
  }
);

/*
* Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.
*/
SourceSchema.plugin(beautifyUnique);

/*
* Pre save hook that hashes passwords.
*/
SourceSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.createdAt = Date.now();
  }
  return next();
});

/*
* Export a Mongoose model based on the SourceSchema schema, which will be named sources, and it can perform CRUD operations
* on documents in the collection.
*/
module.exports = mongoose.model('sources', SourceSchema);
