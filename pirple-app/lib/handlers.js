 /*
  * Request Handlers 
  * 
  */

  //Dependencies
  var _data = require('./data');
  var helpers = require('./helpers');
  var config = require('./config');

 //Define the handlers
 var handlers = {};

 /*
  * HTML Handlers
  *
  */

  handlers.index = function(data, callback) {
  //Reject any request that isn't a get
    if(data.method == 'get'){
      //Read in a template as a string
      helpers.getTemplate('index', function(err, str){
        if(!err && str){
          callback(200, str, 'html');
        }else{
          callback(500, undefined, 'html')
        }
      });
    }else{
      callback(405, undefined, 'html')
    }
  }

  /*
   * JSON API handlers
   * 
   */
  
 //Users
 handlers.users = function(data, callback) {
   var acceptableMethods = ['post', 'get', 'put', 'delete']
   if(acceptableMethods.indexOf(data.method) > -1) {
     handlers._users[data.method](data, callback)
   } else {
     callback(405);
   }
 }

 //Containers for the user sub-methods
 handlers._users = {};

//Users-post
//Required data : firstName, lastName, phone, password, tosAgreement
//Optinal data: none
handlers._users.post = function(data, callback) {
  //Check that all required fields are filled out
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if(firstName && lastName && phone && password && tosAgreement) {
    //Make sure that user doesnot already exists
    _data.read('users', phone, function(err, data){
      if(err) {

        //Hash the password
        var hashpassword = helpers.hash(password);
       
        if(hashpassword){
        //Create user object
        var userObject = {
          'firstName' : firstName,
          'lastName' : lastName,
          'phone' : phone,
          'hashedPassword' : hashpassword,
          'tosAgreement' : true
        };

        //store the user
        _data.create('users', phone, userObject, function(err) {
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
        callback(400, {'Error' : 'A user with that phone number already exists'});
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
}
//Users-get
//Required data:phone
//Optional data:none
handlers._users.get = function(data, callback) {
  //Check that the phone number provided is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && (data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false);
  if(phone) {
    //Get the token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    //Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
      if(tokenIsValid){
        //Lookup the user
        _data.read('users', phone, function(err, data) {
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
//Required data : phone
//Optional data : firstName, lastName, password (atleast one must be specified)
handlers._users.put = function(data, callback) {
  //Check for the require fields
  var phone = typeof(data.payload.phone) == 'string' && (data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false);   

  //Check for optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  //Error if phone is invalid
  if(phone) {
    //Error if nothing is sent to update
    if(firstName || lastName || password){
      //Get the token from headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      //Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
        if(tokenIsValid){
          //Lookup user
          _data.read('users', phone, function(err, userData){
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
              _data.update('users', phone, userData, function(err){
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
//Require field : phone
handlers._users.delete = function(data, callback) {
  //Check phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && (data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false);
  if(phone) {

    //Get the token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    //Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
      if(tokenIsValid){
        //Lookup the user
        _data.read('users', phone, function(err, userData) {
          if(!err && userData) {
            _data.delete('users', phone, function(err){
              if(!err) {
                //Delete each of the checks asscociated with user
                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                var checksToDelete = userChecks.length;

                if(checksToDelete > 0){
                  var checksDeleted = 0;
                  var deletionErrors = false;
                  
                  //Loop through checks
                  userChecks.forEach(checkId => {
                    //Delete checkId
                    _data.delete('checks', checkId, function(err){
                      if(err){
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if(checksDeleted == checksToDelete){
                        if(!deletionErrors){
                          callback(200);
                        }else{
                          callback(500, {'Error' : 'Error encountered while attempting to delete all the checks, Some checks may not have been deleted successfully'});
                        }
                      }
                    })
                  });
                }else{
                  callback(200);
                }
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

 //Tokens
 handlers.tokens = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback)
  } else {
    callback(405);
  }
}

//Containers for all token methods
handlers._tokens = {}

//Tokens - post
//Required data : phone, password
//Optional data : none
handlers._tokens.post = function(data, callback) {
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

  if(phone && password) {
    //Looking the user that matches phone number
    _data.read('users', phone, function(err, userData) {
      if(!err && userData){
        //Hash the sent password and compare with passwor store in user object
        var hashedPassword = helpers.hash(password);
        if(hashedPassword == userData.hashedPassword){
          //Create a new token with random name, set expiration date 1 hour after creation
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'phone' : phone,
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
handlers._tokens.get = function(data, callback) {
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
handlers._tokens.put = function(data, callback) {
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
handlers._tokens.delete = function(data, callback) {
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
handlers._tokens.verifyToken = function(id, phone, callback) {
  //Lookup the token
  _data.read('tokens', id, function(err, tokenData){
    if(!err && tokenData){
      //Check that token is for the given user and has not expired
      if(tokenData.phone == phone && tokenData.expires > Date.now()){
        callback(true);
      }else{
        callback(false);
      }
    }else{
      callback(false);
    }
  })
}

 //Checks
 handlers.checks = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback)
  } else {
    callback(405);
  }
}


//Container for all checks methods
handlers._checks = {};

//Checks - post
//Required data: Protocall, url, method, succesCodes, timeoutSeconds 
//Optinal data:none
handlers._checks.post = function(data, callback) {
  //Validate inputs
  var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim() : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > -1 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim() : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if(protocol && url && method && successCodes && timeoutSeconds){
    //Get the token from header
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    //Lookup the user by reading the token
    _data.read('tokens', token, function(err, tokenData){
      if(!err && tokenData) {
        var userPhone = tokenData.phone

        //Lookup the user
        _data.read('users', userPhone, function(err, userData){
          if(!err && userData){
            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            //Verify that the user has less checks than number of max-checks-per-user
            if(userChecks.length < config.maxChecks){
              //Create the random id for the check
              var checkId = helpers.createRandomString(20);

              //Create the check object and include user's phone
              var checkObject = {
                'id' : checkId,
                'userPhone' : userPhone,
                'protocol' : protocol,
                'url' : url,
                'method' : method,
                'successCodes' : successCodes,
                'timeoutSeconds' : timeoutSeconds
              };

              //Save the object
              _data.create('checks', checkId, checkObject, function(err){
                if(!err){
                  //Add the checkid to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  //Save the new user data
                  _data.update('users', userPhone, userData, function(err){
                    if(!err){
                      //Return the data about the new checks
                      callback(200, checkObject);
                    }else{
                      callback(500, {'Error': 'Could not update the user with new chwck'});
                    }
                  })
                }else{
                  callback(500, {'Error': 'Could not create the new checks'});
                }
              })

            } else{
              callback(400, {'Error':'User already has the max number of checks('+config.maxChecks+')'});
            }
          }else{
            callback(403, {'Error' : 'Could not get user data'});
          }
        })
      }else{
        callback(403, {'Error' : 'Could not get specified token'});
      }
    })

  }else{
    callback(400, {'Error': 'Missing required field or fields are invalid'});
  }
};

//Checks - get
//Required data ; id
//Optional data : none
handlers._checks.get = function(data, callback) {
  //Check that the phone number provided is valid
  var checkId = typeof(data.queryStringObject.checkId) == 'string' && (data.queryStringObject.checkId.trim().length == 20 ? data.queryStringObject.checkId.trim() : false);
  if(checkId) {
    //Lookup the checks
    _data.read('checks', checkId, function(err, checkData){
      if(!err && checkData){
        //Get the token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        //Verify that the given token is valid for the user who created the checks
        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
          if(tokenIsValid){
            //Return the checkData
            callback(200, checkData);
          }else{
            callback(403, {'Error':'Missing required token in header or token is invalid'});
          }
        });
      }else{
        callback(404, {'Error':'Could not find specified checkId'})
      }
    })
  }else{
    callback(400, {'Error' : 'Missing required field'})
  }
};

//Checks - put
//Required data : id
//Optinal field : Protocall, url, method, succesCodes, timeoutSeconds 
handlers._checks.put = function(data, callback) {
  //Check for the require fields
  var id = typeof(data.payload.id) == 'string' && (data.payload.id.trim().length == 20 ? data.payload.id.trim() : false);   
  //Validate optinal inputs
  var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim() : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > -1 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim() : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  //Check to make sure id is valid
  if(id){
    //Check to make sure that one of the optinal field has been sent
    if(protocol || url || method || successCodes || timeoutSeconds){
    //Lookup the check
    _data.read('checks', id, function(err, checkData){
      if(!err && checkData){
        //Get the token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        //Verify that the given token is valid for the user who created the checks
        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
          if(tokenIsValid){
            //Update the check where neccessary
            if(protocol){
              checkData.protocol = protocol;
            }
            if(url){
              checkData.url = url;
            }
            if(method){
              checkData.method = method;
            }
            if(successCodes){
              checkData.successCodes = successCodes;
            }
            if(timeoutSeconds){
              checkData.timeoutSeconds = timeoutSeconds;
            }  
            
          //Store the new update
          _data.update('checks', id, checkData, function(err){
            if(!err){
              callback(200);
            }else{
              callback(500, {'Error' : 'could not update the token expiration'});
            }
          })
          }else{
            callback(403, {'Error':'Missing required token in header or token is invalid'});
          }
        });
      }else{
        callback(400, {'Error': 'CheckId does not exist'});
      }
    })
    }else{
      callback(400, {'Error': 'Missing fields to update'})
    }
  }else{
    callback(400, {'Error' : 'Missing required field'});
  }
};

//Checks - delete
//Required data : id
//Optional data : none
handlers._checks.delete = function(data, callback) {
  //Check phone number is valid
  var id = typeof(data.queryStringObject.id) == 'string' && (data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false);
  if(id) {
    //Lookup the check
    _data.read('checks', id, function(err, checkData){
      if(!err && checkData){
        //Get the token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        //Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
          if(tokenIsValid){
            
            //Delete the check data
            _data.delete('checks', id, function(err){
              if(!err){
                //Lookup the user
                _data.read('users', checkData.userPhone, function(err, userData) {
                  if(!err && userData) {
                    var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                    //Remove the delete check from their list of checks 
                    var checkPosition = userChecks.indexOf(id);
                      if(checkPosition > -1){
                        userChecks.splice(checkPosition, 1);

                        //Re-save user's data
                        _data.update('users', checkData.userPhone, userData, function(err){
                          if(!err){
                            callback(200);
                          }else{
                            callback(500, {'Error': 'Could not update user\'s data'});
                          }
                        })
                      }else{
                        callback(500, {'Error':'Could not find check on user object, so can not delete that'})
                      }
                  }else{
                    callback(400, {'Error' : 'Could not find the specified user'});
                  }
                });
              }else{
                callback(500, {'Error' : 'Could not find the user who created checks so, could not remove the check from the list of checks on the user object'});
              }
            })
          }else{
            callback(403, {'Error':'Missing required token id in header or specified token does not exist'}); 
          }
        });  
      }else{
        callback(403, {'Error' : 'Specified check id does not exist'})
      }
    })
  }else{
    callback(400, {'Error' : 'Missing required field'})
  }
}

 handlers.notFound = function(data, callback) {
   callback(404);
 };

 //Export the module
 module.exports = handlers