/*
 * This file will contains all api's for the user
 */ 
  //Dependencies
  var _data = require('./data');
  var helpers = require('./helpers');
  
  
  var menu = {};
  
  //Menu-get
  //Required data:email
  //Optional data:none
  users.get = function(data, callback) {
    //Check that the email number provided is valid
    var email = typeof(data.queryStringObject.email) == 'string' && (data.queryStringObject.email.trim().length == 10 ? data.queryStringObject.email.trim() : false);
    if(email) {
      //Get the token from headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      //Verify that the given token is valid for the email
      handlers._tokens.verifyToken(token, email, function(tokenIsValid){
        if(tokenIsValid){
          //Lookup the user
          _data.read('users', email, function(err, data) {
            if(!err && data) {
              //remove the hashed password from the data before it returning back to user
              delete data.hashedPassword;
              callback(200, data);
            }else{
               callback(404);
          }
        })
        }else{
          callback(403, {'Error':'Missing required token in header or token is invalid'});
        }
      })
    }else{
      callback(400, {'Error' : 'Missing required field'})
    }
  }
  
   //Export the module
   module.exports = menu