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

const app = express();
app.use(cors());
app.use(helmet());
// App configuration
app.use(compression());

if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));

// Mongo configuration
mongoose();

// Routes
app.use('/', routes);

// Server static files
app.use(express.static(path.join(__dirname, 'assets')));

// error handler
app.use(error);

// We use this form to take port 3000 if and only if there is no value on process.env.port and if the port is not listening it is working
// probably there was a valye in process.env.PORT that was truthy but it wasn't listening.
const {port = 3000} = process.env.PORT
app.listen(port, () =>
// eslint-disable-next-line no-console
  console.log(`NodeJS Server listening on port ${port}. \nMode: ${process.env.NODE_ENV}`));


module.exports = app;
