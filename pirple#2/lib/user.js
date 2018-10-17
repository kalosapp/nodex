/*
 * This file will contains all api's for the user
 */ 
  //Dependencies
var _data = require('./data');
var helpers = require('./helpers');


var users = {};

//Users-post
//Required data : firstName, lastName, email, address, streetAddress
//Optinal data: none
users.post = function(data, callback) {
  //Check that all required fields are filled out
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address : false;
  var streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

  if(firstName && lastName && email && address && streetAddress && password) {
    //Make sure that user doesnot already exists
    _data.read('users', email, function(err, data){
      if(err) {

        //Hash the password
        var hashpassword = helpers.hash(password);
       
        if(hashpassword){
        //Create user object
        var userObject = {
          'firstName' : firstName,
          'lastName' : lastName,
          'email' : email,
          'address' : address,
          'streetAddress' : streetAddress,
          'hashedPassword' : hashpassword
        };

        //store the user
        _data.create('users', email, userObject, function(err) {
          if(!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Could not create a new user'})
          }
        })
       } else {
         callback(500, {'Error' : 'Couldn\'t hash the user\'s passwords'})
       }
      } else {
        //User already exists
        console.log(err)
        callback(400, {'Error' : 'A user with that email number already exists'});
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
}

//Users-get
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

//Users-put
//Required data : email
//Optional data : firstName, lastName, address, streetAddress (atleast one must be specified)
users.put = function(data, callback) {
  //Check for the require fields
  var email = typeof(data.payload.email) == 'string' && (data.payload.email.trim().length == 10 ? data.payload.email.trim() : false);   

  //Check for optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address : false;
  var streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

  //Error if email is invalid
  if(email) {
    //Error if nothing is sent to update
    if(firstName || lastName || address || streetAddress || password){
      //Get the token from headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      //Verify that the given token is valid for the email number
      handlers._tokens.verifyToken(token, email, function(tokenIsValid){
        if(tokenIsValid){
          //Lookup user
          _data.read('users', email, function(err, userData){
            if(!err && userData) {
              //Update the field necessary
              if(firstName){
                userData.firstName = firstName;
              }
              if(lastName){
                userData.lastName = lastName;
              }
              if(password){
                userData.hashedPassword = helpers.hash(password);
              }
              //Store the new update
              _data.update('users', email, userData, function(err){
                if(!err) {
                  callback(200);
                }else{
                  callback(500, {'Error': 'Could not update the user'});
                }
              })
            }else{
              callback(400, {'Error' : 'The specified user does not exists'});
            }
          }) 
        }else{
          callback(403, {'Error':'Missing required token in header or token is invalid'});
        }
      })
    }else{
      callback(400, {'Error' : 'Missing fields to update'});
    }
  }else{
    callback(400, {'Error' : 'Missing required field'});
  }
}

//Users-delete
//Require field : email
users.delete = function(data, callback) {
  //Check email number is valid
  var email = typeof(data.queryStringObject.email) == 'string' && (data.queryStringObject.email.trim().length == 10 ? data.queryStringObject.email.trim() : false);
  if(email) {

    //Get the token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    //Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token, email, function(tokenIsValid){
      if(tokenIsValid){
        //Lookup the user
        _data.read('users', email, function(err, userData) {
          if(!err && userData) {
            _data.delete('users', email, function(err){
              if(!err) {
                callback(200)
              }else{
                callback(500, {'Error' : 'Could not delete user data'});
              }
            })
          }else{
            callback(400, {'Error' : 'Could not find the specified user'});
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
 module.exports = user