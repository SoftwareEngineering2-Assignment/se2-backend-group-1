/*
* Ιmport mongoose in the object mongoose.
*/
const mongoose = require('mongoose');

/*
* An object containing options for the Mongoose connection is defined.
*/
const mongooseOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  poolSize: 100,
  keepAlive: true,
  keepAliveInitialDelay: 300000
};

// Set the value of the secret.
const mongodbUri = process.env.MONGODB_URI;

// Export the module with the above options.
module.exports = () => {
  // eslint-disable-next-line no-console
  mongoose.connect(mongodbUri, mongooseOptions).catch(console.error);
};
