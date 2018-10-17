/*
 * This file will contains all api's for the user
 */ 

//Dependencies
var _data = require('./data');
var helpers = require('./helpers');

//Containers for all token methods
var tokens = {}

//Tokens - post
//Required data : email, password
//Optional data : none
tokens.post = function(data, callback) {
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length == 10 ? data.payload.email : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

  if(email && password) {
    //Looking the user that matches email
    _data.read('users', email, function(err, userData) {
      if(!err && userData){
        //Hash the sent password and compare with passwor store in user object
        var hashedPassword = helpers.hash(password);
        if(hashedPassword == userData.hashedPassword){
          //Create a new token with random name, set expiration date 1 hour after creation
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'email' : email,
            'tokenId' : tokenId,
            'expires' : expires
          };
          //Store the tokens
          _data.create('tokens', tokenId, tokenObject, function(err){
            if(!err){
              callback(200, tokenObject);
            }else{
              callback(500, {'Error':'Could not create the new token'});
            }
          }) 
        }else{
          callback(400, {'Error':'Password did not matched with specified user\'s password'});
        }
      }else{
        callback(400, {'Error': 'Could not found the specified user'});
      }
    })

  }else{
    callback(400, {'Error' : 'Required fields missing'});
  }
};
//Tokens - get
//Required data - id
//Optional data - none
tokens.get = function(data, callback) {
  //Check that the id provided is valid
  var id = typeof(data.queryStringObject.id) == 'string' && (data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false);
  if(id) {
    //Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
      if(!err && tokenData) {
        callback(200, tokenData);
      }else{
        callback(404);
      }
    })
  }else{
    callback(400, {'Error' : 'Missing required field'})
  }
};
//Tokens - put
//Required data - id, extend
//Optinal data - none 
tokens.put = function(data, callback) {
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if(id && extend) {
    //Lookup the token
    _data.read('tokens', id, function(err, tokenData){
      if(!err && tokenData){
        //Check to make sure that token is not already expired
        if(tokenData.expires > Date.now()){
          //Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          //Store the new update
          _data.update('tokens', id, tokenData, function(err){
            if(!err){
              callback(200);
            }else{
              callback(500, {'Error' : 'could not update the token expiration'});
            }
          })
        }else{
          callback(400, {'Error': 'Token has already epired and can not be extended'})
        }
      }else{
        callback(500, {'Error':'Specified token does not exist'});
      }
    })
  }else{
    callback(400, {'Error' : 'Missing required field or invalid field(s)'})
  }
};
//Tokens - delete
//Required data - id
//Optional data - none
tokens.delete = function(data, callback) {
  //check the id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && (data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false);
  if(id) {
    //Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
      if(!err && tokenData) {
        _data.delete('tokens', id, function(err){
          if(!err) {
            callback(200);
          }else{
            callback(500, {'Error' : 'Could not delete token data'});
          }
        })
      }else{
        callback(400, {'Error' : 'Could not find the specified token'});
      }
    })
  }else{
    callback(400, {'Error' : 'Missing required field'})
  }
};

//Verify current token id is currently valid for a given user
tokens.verifyToken = function(id, email, callback) {
  //Lookup the token
  _data.read('tokens', id, function(err, tokenData){
    if(!err && tokenData){
      //Check that token is for the given user and has not expired
      if(tokenData.email == email && tokenData.expires > Date.now()){
        callback(true);
      }else{
        callback(false);
      }
    }else{
      callback(false);
    }
  })
}

 //Export the module
 module.exports = token