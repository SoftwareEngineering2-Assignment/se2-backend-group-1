/*
* Import express and initializing a router, mongoose, middlewares module and source from models.
* eslint-disable max-len
*/
const express = require('express');
const mongoose = require('mongoose');
const {authorization} = require('../middlewares');
const router = express.Router();
const Source = require('../models/source');

/* 
* Every handling of GET/POST requests of different types and using the authorization middleware first. Then send a JSON object with the appropriate 
* response. If an error occurs during the execution of the following routes handlers, it will pass control to the next middleware with the error 
* as an argument, for the error to be handled. 
*/

// Retrieve all sources that belong to a user, then go through the sources and pushes an object containing the source information.
router.get('/sources',
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.decoded;
      const foundSources = await Source.find({owner: mongoose.Types.ObjectId(id)});
      const sources = [];
      foundSources.forEach((s) => {
        sources.push({
          id: s._id,
          name: s.name,
          type: s.type,
          url: s.url,
          login: s.login,
          passcode: s.passcode,
          vhost: s.vhost,
          active: false
        });
      });

      return res.json({
        success: true,
        sources
      });
    } catch (err) {
      return next(err.body);
    }
  }); 
// Check if a source with the same name already exists for the user.
router.post('/create-source', 
  authorization,
  async (req, res, next) => {
    try {
      const {name, type, url, login, passcode, vhost} = req.body;
      const {id} = req.decoded;
      const foundSource = await Source.findOne({owner: mongoose.Types.ObjectId(id), name});
      if (foundSource) {
        return res.json({
          status: 409,
          message: 'A source with that name already exists.'
        });
      }
      await new Source({
        name,
        type,
        url,
        login,
        passcode,
        vhost,
        owner: mongoose.Types.ObjectId(id)
      }).save();
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  });  
// Check if the source object with the provided id exists and if it is owned by the authenticated user.
router.post('/change-source', 
  authorization,
  async (req, res, next) => {
    try {
      const {id, name, type, url, login, passcode, vhost} = req.body;
      const foundSource = await Source.findOne({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      const sameNameSources = await Source.findOne({_id: {$ne: mongoose.Types.ObjectId(id)}, owner: mongoose.Types.ObjectId(req.decoded.id), name});
      if (sameNameSources) {
        return res.json({
          status: 409,
          message: 'A source with the same name has been found.'
        });
      }
      foundSource.name = name;
      foundSource.type = type;
      foundSource.url = url;
      foundSource.login = login;
      foundSource.passcode = passcode;
      foundSource.vhost = vhost;
      await foundSource.save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 
// Delete a source if it is found in the database and the authenticated user is the owner of the source.
router.post('/delete-source', 
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.body;

      const foundSource = await Source.findOneAndRemove({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 
/*
* Get the name, owner and user from body. Then check if the owner is 'self'. If it is, set the userId to the id of the user object. 
* If it is not, set the userId to the value of owner. Use the Source model to find a data source with a name and owner that match the
* provided name and userId, respectively.
*/
router.post('/source',
  async (req, res, next) => {
    try {
      const {name, owner, user} = req.body;
      const userId = (owner === 'self') ? user.id : owner;
      const foundSource = await Source.findOne({name, owner: mongoose.Types.ObjectId(userId)});
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      const source = {};
      source.type = foundSource.type;
      source.url = foundSource.url;
      source.login = foundSource.login;
      source.passcode = foundSource.passcode;
      source.vhost = foundSource.vhost;
    
      return res.json({
        success: true,
        source
      });
    } catch (err) {
      return next(err.body);
    }
  });

/*
* Check a list of body and create new sources if they don't already exist in the database. Initialize an empty array to store any sources 
* that need to be created. Then loop through the list in body and check if each one exists in the database. If it doesn't exist, add to the 
* newSources array. After the loop completes, loop through the newSources and create a new source for each item in the array using the Source model.
*/
router.post('/check-sources',
  authorization,
  async (req, res, next) => {
    try {
      const {sources} = req.body;
      const {id} = req.decoded;
      const newSources = [];

      for (let i = 0; i < sources.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const result = await Source.findOne({name: sources[i], owner: mongoose.Types.ObjectId(id)});
        if (!result) {
          newSources.push(sources[i]);
        }
      }

      for (let i = 0; i < newSources.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Source({
          name: newSources[i],
          type: 'stomp',
          url: '',
          login: '',
          passcode: '',
          vhost: '',
          owner: mongoose.Types.ObjectId(id)
        }).save();
      } 
      
      return res.json({
        success: true,
        newSources
      });
    } catch (err) {
      return next(err.body);
    }
  });

// Export the router
module.exports = router;
