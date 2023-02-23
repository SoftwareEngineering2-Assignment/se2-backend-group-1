// Import path
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({path: path.join(__dirname, '../', '.env')});

// Import required modules
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

// Import custom modules
const {error} = require('./middlewares');
const routes = require('./routes');
const {mongoose} = require('./config');

// Create an instance of the express app
const app = express();

// Set up middleware functions
app.use(cors()); // Allow cross-origin resource sharing
app.use(helmet()); // Set various HTTP headers to prevent common attacks
app.use(compression()); // Compress the response body

// Use logger middleware only if NODE_ENV is not 'test'
if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}

// Parse request body as JSON
app.use(bodyParser.json({limit: '50mb'}));

// Parse URL-encoded request body and set extended option to false
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));

// Connect to MongoDB
mongoose();

// Register routes
app.use('/', routes);

// Serve static files from the 'assets' directory
app.use(express.static(path.join(__dirname, 'assets')));

// Use error handling middleware
app.use(error);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`NodeJS Server listening on port ${port}. \nMode: ${process.env.NODE_ENV}`);
});

// Export the app
module.exports = app;
