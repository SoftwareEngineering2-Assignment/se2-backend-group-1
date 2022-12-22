/*
* Import path, .env, express, morgan, body-parser, helmet, compression, cors and middlewares, routes and config modules.
*/
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../', '.env')});
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const {error} = require('./middlewares');
const routes = require('./routes');
const {mongoose} = require('./config');

/*
* Initialize an app and make it so, it serves resources to a client from a different origin than the one the client is coming from,
* set various HTTP headers to prevent common attacks and compress the body of the app, for configuration.
*/
const app = express();
app.use(cors());
app.use(helmet());
app.use(compression());

/*
* The logger middleware will only be used if the NODE_ENV is set to 'test', this allows to disable certain middleware functions when running tests
* to avoid generating unnecessary output or modifying the request or response objects in unintended ways.

* Then set the limit of json and urlencoded to 50mb and urlencoded extented to false.  
*/ 
if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));

/*
* Mongo configuration
*/
mongoose();

/*
* Use routes.
*/
app.use('/', routes);

/*
* Use the server static files.
*/
app.use(express.static(path.join(__dirname, 'assets')));

/*
* Use the error handler.
*/
app.use(error);

/*
* Set the port to .env or 3000
*/
const port = process.env.PORT || 3000;

/*
* Listen to the port and print a text in the console.
*/
app.listen(port, () =>
// eslint-disable-next-line no-console
  console.log(`NodeJS Server listening on port ${port}. \nMode: ${process.env.NODE_ENV}`));

/*
* Export the app.
*/
module.exports = app;
