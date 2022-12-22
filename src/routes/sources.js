/*
* Import express and initializing a router, mongoose, middlewares module and source from models.
*/
/* eslint-disable max-len */
const express = require('express');
const mongoose = require('mongoose');
const {authorization} = require('../middlewares');
const router = express.Router();
const Source = require('../models/source');

/* 
* Every handling of GET/POST requests is using the authorization middleware first.
* If an error occurs during the execution of the following routes handlers, it will pass control to the next middleware with the error 
* as an argument, for the error to be handled.
*/

/*
* Handling GET requests to the '/sources' route, retrieve all sources that belong to a user, then go through 
* the sources and pushes an object containing the source information. Then return a JSON object with success property and the sources array.
*/  
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
  
/*
* Handling POST requests to the '/create-source' route. Check if a source with the same name already exists for the user. If it does,
* return a response with status code of 409 and a message indicating that a source with that name already exists.
* If it does not, create a new Source object with the provided data and the id of the authenticated user and saves it to the database.
* If the save is successful, return a response with success set to true.
*/
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
  
/*
* Handling POST requests to the '/change-source' route. Check if the source object with the provided id exists and if it is owned by 
* the authenticated user. If it does not or is not owned by the authenticated user, the route sends a response with a 409 status code 
* and an error message. If it does, check if there is already a source object with the same name owned by the authenticated user and if it does exist,
* send a response with status set to 409 and an error message.
* If there are no issues, update the properties of the source object with the provided values and save the updated object to the database. 
* Then send a response with success set to true.
*/
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

/*
* Handling POST requests to the '/delete-source' route, delete a source if it is found in the database and the authenticated 
* user is the owner of the source. If it is not found or the authenticated user is not the owner of the source, return a JSON object 
* with status set to 409 and a message. If the source is successfully deleted, return a JSON object with success set to true.
* Find a single source in the database that matches the specified id and owner s and remove it. 
* Return the deleted document as a result, if no document is found, return null.
*/
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
* Handling POST requests to the '/source' route, get the name, owner and user from body. Then check if the owner is 'self'
* If it is, set the userId to the id of the user object. If it is not, set the userId to the value of owner.
* Use the Source model to find a data source with a name and owner that match the provided name and userId, respectively.
* If no matching source is found, return a response with status of 409 and a message indicating that the source was not found.
* If a matching source is found, create a new object called source and populate it with the type, url, login, passcode and vhost
* of the found source. Then return a response with success set to true and the source object.
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
* Handling POST requests to the '/check-source' route, check a list of body and create new sources if they don't already exist in the database.
* Initialize an empty array to store any sources that need to be created. Then loop through the list in body and check if each one exists 
* in the database. If it doesn't exist, add to the newSources array.
* After the loop completes, loop through the newSources and create a new source for each item in the array using the Source model.
* Return a JSON response containing the success set to true and newSources.
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

/*
* Export the router
*/ 
module.exports = router;
