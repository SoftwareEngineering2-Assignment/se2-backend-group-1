// Import path and express 
const express = require('express');
const path = require('path');

// Define a middleware router. 
const router = express.Router();

// Set the path of current module to index.html.  
const file = path.join(__dirname, '../../index.html');

// Serve static files from the same directory as the index.html file.
router.use(express.static(file));

// Send the contents of the index.html to the client.
router.get('/', (req, res) => res.sendFile(file));

// Export the router.
module.exports = router;
