// Import dependencies


// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 






const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {constants: {expires}} = require('../utilities/validation');

// Define a Mongoose schema for a reset token document.
const ResetSchema = new mongoose.Schema({
  username: {
    index: true, // Adds faster performance
    type: String,
    required: true,
    unique: 'A token already exists for that username!',
    lowercase: true
  },
  token: {
    type: String,
    required: true,
  },
  expireAt: {
    type: Date,
    default: Date.now,
    index: { expires }, // Set a TTL index on the expireAt field to automatically delete expired tokens.
  },
});

// Format unique constraint errors in a user-friendly way.
ResetSchema.plugin(beautifyUnique);

// Disable pluralization of the collection name.
mongoose.pluralize(null);

// Export the ResetToken model
module.exports = mongoose.model('reset-tokens', ResetSchema);
