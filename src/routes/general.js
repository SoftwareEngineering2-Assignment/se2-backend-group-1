/*
* Import express, got and user,dashboard, source from models folder.
*/
/* eslint-disable max-len */
const express = require('express');
const got = require('got');

const router = express.Router();

const User = require('../models/user');
const Dashboard = require('../models/dashboard');
const Source = require('../models/source');

/* 
* Handling GET/POST requests. If an error occurs during the execution of the following routes handlers, it will pass control to the next
* middleware with the error as an argument, for the error to be handled.
*/

/*
* Get and assign the url, type, headers, body and params, then use a switch to handle different HTTP request types.
* If it is a GET/POST/PUT request make a GET/POST/PUT request to the specified url and pass the headers and params as options. 
* If the request type is none of these, set statusCode to 500 and a message indicating that something went wrong.
* After that, return a JSON object with status set to the statusCode of the response and a response set to the body of the response.
*/
router.get('/statistics',
  async (req, res, next) => {
    try {
      const users = await User.countDocuments();
      const dashboards = await Dashboard.countDocuments();
      const views = await Dashboard.aggregate([
        {
          $group: {
            _id: null, 
            views: {$sum: '$views'}
          }
        }
      ]);
      const sources = await Source.countDocuments();

      let totalViews = 0;
      if (views[0] && views[0].views) {
        totalViews = views[0].views;
      }

      return res.json({
        success: true,
        users,
        dashboards,
        views: totalViews,
        sources
      });
    } catch (err) {
      return next(err.body);
    }
  });

/*
* Get and assign the url and make a GET request to the specified url, then return a JSON object with status 
* set to statusCode and an active set to a boolean indicating whether the status code is 200. 
*/
router.get('/test-url',
  async (req, res) => {
    try {
      const {url} = req.query;
      const {statusCode} = await got(url);
      return res.json({
        status: statusCode,
        active: (statusCode === 200),
      });
    } catch (err) {
      return res.json({
        status: 500,
        active: false,
      });
    }
  });

/*
* Get and assign the url, type, headers, body, and params, then use a switch statement to handle different HTTP request types. 
* If the request type is GET/POST/PUT, make a GET/POST/PUT request to the specified url and pass the headers and params as options. 
* If the request type is not one of these, set the statusCode to 500 and the body to a message indicating that something went wrong.
* After making the HTTP request, return a JSON object with status set to the statusCode of the response and a response set to body. 
*/
router.get('/test-url-request',
  async (req, res) => {
    try {
      const {url, type, headers, body: requestBody, params} = req.query;

      let statusCode;
      let body;
      switch (type) {
        case 'GET':
          ({statusCode, body} = await got(url, {
            headers: headers ? JSON.parse(headers) : {},
            searchParams: params ? JSON.parse(params) : {}
          }));
          break;
        case 'POST':
          ({statusCode, body} = await got.post(url, {
            headers: headers ? JSON.parse(headers) : {},
            json: requestBody ? JSON.parse(requestBody) : {}
          }));
          break;
        case 'PUT':
          ({statusCode, body} = await got.put(url, {
            headers: headers ? JSON.parse(headers) : {},
            json: requestBody ? JSON.parse(requestBody) : {}
          }));
          break;
        default:
          statusCode = 500;
          body = 'Something went wrong';
      }
      
      return res.json({
        status: statusCode,
        response: body,
      });
    } catch (err) {
      return res.json({
        status: 500,
        response: err.toString(),
      });
    }
  });

// Export the router
module.exports = router;
