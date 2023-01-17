/*
* Import the necessary modules 
*/
/* eslint-disable max-len */
const express = require('express');
const mongoose = require('mongoose');
const {authorization} = require('../middlewares');
const router = express.Router();
const Dashboard = require('../models/dashboard');
const Source = require('../models/source');

// Handling GET/POST requests and use an authorize middleware. If an error occurs during the execution of the following routes handlers, 
// it will pass control to the next middleware with the error as an argument, for the error to be handled.

// An async function, retrieves the id from the decoded of the request object req. It uses the id value to find all 
// dashboard s in the database where the owner field matches the id value. Then create an array of objects with id, name
// and views and assigns it to the dashboards variable. 
// Then a JSON response is sent to the client with success set to true and the dashboards array as the value of the dashboards field.
router.get('/dashboards',
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.decoded;
      const foundDashboards = await Dashboard.find({owner: mongoose.Types.ObjectId(id)});
      const dashboards = [];
      foundDashboards.forEach((s) => {
        dashboards.push({
          id: s._id,
          name: s.name,
          views: s.views
        });
      });

      return res.json({
        success: true,
        dashboards
      });
    } catch (err) {
      return next(err.body);
    }
  });

/*
* An async function, retrieves the name and the id from the decoded of the request object req. It uses their values to find a 
* dashboard in the database where the owner field matches their values. Then create an array of objects with id, name
* and views and assigns it to the dashboards variable. 
* If one is found, a JSON response to the client is sent with status set to 409 (conflict) and a message indicating that a dashboard
* with that name already exists.
* If none is found, then creates a new dashboard and saves it to the database, with name as variable, a layout set to an empty array, 
* items set to an empty object, nextId set to 1 and owner set to id. Then sends a JSON response to the client with success set to true.
*/  
router.post('/create-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {name} = req.body;
      const {id} = req.decoded;
      const foundDashboard = await Dashboard.findOne({owner: mongoose.Types.ObjectId(id), name});
      if (foundDashboard) {
        return res.json({
          status: 409,
          message: 'A dashboard with that name already exists.'
        });
      }
      await new Dashboard({
        name,
        layout: [],
        items: {},
        nextId: 1,
        owner: mongoose.Types.ObjectId(id)
      }).save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

/*
* An async function, retrieves the id from the request body and then the id from the decoded of the request object req. 
* It uses their values to find a dashboard in the database where the owner field matches their values.
* If one is found, removes the dashboard from the database and sends a JSON response to the client with success set to true.
* If none is found, sends a JSON response to the client with a status set to 409 (Conflict) and a message indicating that 
* the selected dashboard has not been found. 
*/
router.post('/delete-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.body;

      const foundDashboard = await Dashboard.findOneAndRemove({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

/*
* Define an empty object called dashboard and assign it values of certain fields from the foundDashboard object.
* Find all source documents that belong to the authenticated user and push the names of these sources into the sources array.
* Send a JSON response with success set to true, the dashboard and the sources.          
*/
router.get('/dashboard',
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.query;

      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }

      const dashboard = {};
      dashboard.id = foundDashboard._id;
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;
      dashboard.nextId = foundDashboard.nextId;

      const foundSources = await Source.find({owner: mongoose.Types.ObjectId(req.decoded.id)});
      const sources = [];
      foundSources.forEach((s) => {
        sources.push(s.name);
      });
    
      return res.json({
        success: true,
        dashboard,
        sources
      });
    } catch (err) {
      return next(err.body);
    }
  });

/*
* Get the values of id, layout, items and nextId and update the dashboard in the database. Find a document with a matching id and an authenticated user. 
* If one is found, update the layout, items and nextId and sends a JSON response with success set to true.
* If none is found, return a JSON object with status 409 (conflict) and a message indicating that the selected dashboard was not found. 
*/
router.post('/save-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {id, layout, items, nextId} = req.body;

      const result = await Dashboard.findOneAndUpdate({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)}, {
        $set: {
          layout,
          items,
          nextId
        }
      }, {new: true});

      if (result === null) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

/*
* Get the values of dashboardId and name. Find the values of id, layout, items and nextId and find the dashboard in the database,
* find a document with authenticated user and a matching name.
* If one is found, return a JSON object with status 409 and a message indicating that a dashboard with that name already exists. Then
* create a new dashboard document with the name, layout, items, nextId and owner from the old dashboard. Save the new dashboard to 
* the database and returns a JSON object with a success field set to true.  
* If none is found, find a dashboard with an id that matches it and an owner that matches the id of the authenticated user. 
*/
router.post('/clone-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {dashboardId, name} = req.body;

      const foundDashboard = await Dashboard.findOne({owner: mongoose.Types.ObjectId(req.decoded.id), name});
      if (foundDashboard) {
        return res.json({
          status: 409,
          message: 'A dashboard with that name already exists.'
        });
      }

      const oldDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(req.decoded.id)});
      
      await new Dashboard({
        name,
        layout: oldDashboard.layout,
        items: oldDashboard.items,
        nextId: oldDashboard.nextId,
        owner: mongoose.Types.ObjectId(req.decoded.id)
      }).save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

/*
* Find a dashboard in the database with a matching id with dashboardId.
* If none is found, return a JSON object with status 409 and message indicating that the specified dashboard was not found.
* If one is found, create an empty dashboard and assigns the name, layout and items of the dashboard to it. Check if the user
* has an id that matches the owner field of the found dashboard.
* If they match, increment the views of the dashboard by 1 and update the document in the database. Then return a JSON object with success
* set to true and a shared set to foundDashboard.shared.
* If they don't, check if the shared field in the found dashboard is true.
* If it is true, return a JSON object with success set to true and a shared field set to true. 
* If it is false, return a JSON object with success set to true and a shared field set to false. 
* If the password is not null, return a JSON object with success set to true, a shared field set to true and a passwordNeeded set to true.
* If the password is null, return a JSON object with success set to true, a shared field set to true and a passwordNeeded set to false.
*/
router.post('/check-password-needed', 
  async (req, res, next) => {
    try {
      const {user, dashboardId} = req.body;
      const userId = user.id;

      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId)}).select('+password');
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }

      const dashboard = {};
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;

      if (userId && foundDashboard.owner.equals(userId)) {
        foundDashboard.views += 1;
        await foundDashboard.save();

        return res.json({
          success: true,
          owner: 'self',
          shared: foundDashboard.shared,
          hasPassword: foundDashboard.password !== null,
          dashboard
        });
      } 
      if (!(foundDashboard.shared)) {
        return res.json({
          success: true,
          owner: '',
          shared: false
        });
      }
      if (foundDashboard.password === null) {
        foundDashboard.views += 1;
        await foundDashboard.save();

        return res.json({
          success: true,
          owner: foundDashboard.owner,
          shared: true,
          passwordNeeded: false,
          dashboard
        });
      }
      return res.json({
        success: true,
        owner: '',
        shared: true,
        passwordNeeded: true
      });
    } catch (err) {
      return next(err.body);
    }
  }); 

/*
* Get and assign the dashboardId and password and find a dashboard with a matching id with dashboardId. 
* If none is found, return a JSON object with status of 409 and message indicating that the specified dashboard was not found.
* If one is found, compare the password in the request body to the password of the dashboard.
* If the passwords do not match, return a JSON object with success set to true and a correctPassword set to false.
* If the passwords match, increment the views of dashboard by 1 and update it in the database. Then create an empty 
* dashboard object and assign the name, layout and items of the dashboard to it. Then return a JSON object with
* success set to true, a correctPassword set to true and an owner set to foundDashboard.owner.
*/  
router.post('/check-password', 
  async (req, res, next) => {
    try {
      const {dashboardId, password} = req.body;

      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId)}).select('+password');
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }
      if (!foundDashboard.comparePassword(password, foundDashboard.password)) {
        return res.json({
          success: true,
          correctPassword: false
        });
      }

      foundDashboard.views += 1;
      await foundDashboard.save();

      const dashboard = {};
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;

      return res.json({
        success: true,
        correctPassword: true,
        owner: foundDashboard.owner,
        dashboard
      });
    } catch (err) {
      return next(err.body);
    }
  }); 

/*
* Get and assign the dashboardId and use the req.decoded object to get the id of the authenticated user. Then find a dashboard 
* in the database with a matching id with dashboardId and an authenticated user.
* If none is found, return a JSON object with status of 409 and message indicating that the specified dashboard was not found.
* If one is found, assign the opposite of its current value and save the updated dashboard to the database and returns a JSON object
* with success set to true and shared set to foundDashboard.shared.
*/
router.post('/share-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {dashboardId} = req.body;
      const {id} = req.decoded;

      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(id)});
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }
      foundDashboard.shared = !(foundDashboard.shared);
      
      await foundDashboard.save();

      return res.json({
        success: true,
        shared: foundDashboard.shared
      });
    } catch (err) {
      return next(err.body);
    }
  }); 

/*
* Get and assign the dashboardId and password and use the req.decoded object to get the id of the authenticated user. Then find a dashboard 
* in the database with a matching id and an authenticated user. 
* If none is found, return a JSON object with status 409 and message indicating that the specified dashboard was not found.
* If one is found, assign the value of the password passed to the dashboard. Then save the updated dashboard to the database and return
* a JSON object with success set to true.
*/
router.post('/change-password', 
  authorization,
  async (req, res, next) => {
    try {
      const {dashboardId, password} = req.body;
      const {id} = req.decoded;

      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(id)});
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }
      foundDashboard.password = password;
      
      await foundDashboard.save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

// Export the router
module.exports = router;
