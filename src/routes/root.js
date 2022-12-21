/*
* Import path and express 
*/
const express = require('express');
const path = require('path');

/*
* Define a middleware router object. 
*/
const router = express.Router();

/*
* Set the path of current module to index.html.  
*/
const file = path.join(__dirname, '../../index.html');

/*
* Make the middleware function to serve static files from the same directory as the index.html file.
*/
router.use(express.static(file));

/*
* Send the contents of the index.html file as a response to the client.
*/
router.get('/', (req, res) => res.sendFile(file));

/*
* Export the router object, which makes it available for use in other parts of the application.
*/
module.exports = router;
