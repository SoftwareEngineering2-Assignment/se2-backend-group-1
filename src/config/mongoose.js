/*
* Ιmport the file mongoose in the object mongoose.
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

/*
* mongodbUri takes the value from the .env file
*/ 
const mongodbUri = process.env.MONGODB_URI;

/*
* The above options are passed to the connect() method of the mongoose object when the connection is established.
* The connect() method takes two arguments: the URI of the MongoDB database (from the .env file) and the options from above.
*/
module.exports = () => {
  // eslint-disable-next-line no-console
  mongoose.connect(mongodbUri, mongooseOptions).catch(console.error);
};
