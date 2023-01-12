// Importing mongoose and a mongoose plugin for more user-friendly validation error messages when a unique constraint is violated and validation.
/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {constants: {expires}} = require('../utilities/validation');

// Define a Mongoose schema for a reset token document
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

// Make duplicate errors into regular Mongoose validation errors.
ResetSchema.plugin(beautifyUnique);

// Converts a singular word to its plural form. 
mongoose.pluralize(null);

// Export a Mongoose model based on reset tokens.
module.exports = mongoose.model('reset-tokens', ResetSchema);
