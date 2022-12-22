/*
* Import everything from the routes module and also express 
*/
const express = require('express');
const users = require('./users');
const sources = require('./sources');
const dashboards = require('./dashboards');
const general = require('./general');
const root = require('./root');

// Define a middleware router object. 
const router = express.Router();

/*
* Set up several routes for the router, such as users, sources, dashboards, general and root. 
*/
router.use('/users', users);
router.use('/sources', sources);
router.use('/dashboards', dashboards);
router.use('/general', general);
router.use('/', root);

// Export the router.
module.exports = router;
