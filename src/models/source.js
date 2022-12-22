/*
* Importing mongoose and a mongoose plugin for more user-friendly validation error messages when a unique constraint is violated.
*/
/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

// Converts a singular word to its plural form. 
mongoose.pluralize(null);

/*
* Define a Mongoose schema for a Source model with fields name, type, url, login, passcode, vhost, owner, createdAt, with their specific parameters.
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

// Turns duplicate errors into regular Mongoose validation errors.
SourceSchema.plugin(beautifyUnique);

// Pre save hook that hashes passwords.
SourceSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.createdAt = Date.now();
  }
  return next();
});

// Export the mongoose model.
module.exports = mongoose.model('sources', SourceSchema);
