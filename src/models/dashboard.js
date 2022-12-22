/*
* Importing mongoose and a mongoose plugin for more user-friendly validation error messages when a unique constraint is violated.
*/
/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {passwordDigest, comparePassword} = require('../utilities/authentication/helpers');

// Converts a singular word to its plural form. 
mongoose.pluralize(null);

/*
* Define a Mongoose schema for a dashboard document in a MongoDB database. The schema specifies the structure of
* the dashboard document and includes information about the type, required status and default value of each field in the document.
* The fields of the schema are the dashboard's: name, layout, items, nextId, password, shared, views, owner, and creation date.
* The name field is required.
* The password field is marked as false, which means that it will not be included in the result of a query unless explicitly requested.
* The owner field is a reference to a user document in the database and the createdAt field stores the date the dashboard document was created.
*/
const DashboardSchema = new mongoose.Schema(
  {
    name: {
      index: true,
      type: String,
      required: [true, 'Dashboard name is required']
    },
    layout: {
      type: Array,
      default: []
    },
    items: {
      type: Object,
      default: {}
    },
    nextId: {
      type: Number,
      min: 1,
      default: 1
    },
    password: {
      type: String,
      select: false,
      default: null
    },
    shared: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {type: Date}
  }
);

// Turns duplicate errors into regular Mongoose validation errors.
DashboardSchema.plugin(beautifyUnique);

// Pre save hook that hashes passwords.
DashboardSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = passwordDigest(this.password);
  }
  if (this.isModified('name')) {
    this.createdAt = Date.now();
  }
  return next();
});

// Model method that compares hashed passwords.
DashboardSchema.methods.comparePassword = function (password) {
  return comparePassword(password, this.password);
};

// Export a Mongoose model.
module.exports = mongoose.model('dashboards', DashboardSchema);
