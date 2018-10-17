 /*
  * Request Handlers 
  * 
  */

  //Dependencies
  var _data = require('./data');
  var helpers = require('./helpers');
  var config = require('./config');
  var userHandler = require('./user');
  var tokenHandler = require('./token');
  var menu = require('./menu');
  var cart = require('./cart');

 //Define the handlers
 var handlers = {};

 //Users
 handlers.users = function(data, callback) {
   var acceptableMethods = ['post', 'get', 'put', 'delete']
   if(acceptableMethods.indexOf(data.method) > -1) {
    userHandler[data.method](data, callback)
   } else {
     callback(405);
   }
 }


 //Tokens
 handlers.tokens = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1) {
    tokens[data.method](data, callback)
  } else {
    callback(405);
  }
}

 //Menu
 handlers.menu = function(data, callback) {
  var acceptableMethods = ['get']
  if(acceptableMethods.indexOf(data.method) > -1) {
    menu[data.method](data, callback)
  } else {
    callback(405);
  }
}

handlers.cart = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1) {
    cart[data.method](data, callback)
  } else {
    callback(405);
  }
}

 //Export the module
 module.exports = handlers