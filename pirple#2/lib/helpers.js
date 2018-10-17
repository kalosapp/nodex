/*
 *Helpers for various task
 * 
 */ 

 //Dependencies
 var crypto = require('crypto');
 var config = require('./config');
 var https = require('https');
 var querystring = require('querystring');

 //Containers for all helpers
 var helpers = {};

 //Create a SHA256 hash
 helpers.hash = function(str) {
   if(typeof(str) == 'string' && str.length > 0) {
     var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
     return hash
   } else {
     return false;
   }
 }

 //parse a JSON string in all cases, without throwing 
 helpers.parseJsonToObject = function(str) {
   try {
     var obj = JSON.parse(str);
     return obj;
   } catch(e){
     return {};
   }
 };

 //Create a random string of alphanumeric characters, of a given length
 helpers.createRandomString = function(strLength) {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength) {
    //Define all the possible characters that can go into string
    var possibleCharacters = 'abcdefghijklmnpqrstuvwxyz0123456789';

    //Start the final string
    var str = '';
    for(var i = 1; i <= strLength; i++) {
      //Get a random string from possible characters strings
      var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      //Append this character to the final string
      str += randomCharacter;
    }
    //Return final string
    return str;
  }else{
    return false;
  }
 } 


 //Send an SMS message via twilio

 helpers.sendTwilioSms = function(phone, msg, callback){
   //Validate parameters
   phone = typeof(phone) == 'string' && phone.trim().length == 10 ?  phone.trim() : false;
   msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <=1600 ? msg.trim() : false;

   if(phone && msg){
     //Configure the request payload
     var payload = {
       'From' : config.twilio.fromPhone,
       'To' : '+91' + phone,
       'Body' : msg

     };

     //Configure the request details
     var stringPayload = querystring.stringify(payload);

     //Configure the request details
     var requestDetails = {
       'protocol' : 'https:',
       'hostname' : 'api.twilio.com',
       'method' : 'POST',
       'path' : '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
       'auth' : config.twilio.accountSid+ ':' + config.twilio.authToken,
       'headers' : {
         'Content-Type' : 'application/x-www-form-urlencoded',
         'Content-Length' : Buffer.byteLength(stringPayload)
       }
     };

     //Instantiate the request object
     var req = https.request(requestDetails, function(res){
       //Grab the status of response object
       var status = res.statusCode;
       //Callback successfully if the request went through
       if(status == 200 || status == 201){
         callback(false)
       }else{
         callback('Status code return was ' + statusCode);
       }
     });

     //Bind to an error event so it doesn't get thrown
     req.on('error', function(e){
       callback(e);
     })

     //Add the payload
     req.write(stringPayload);

     //End the request
     req.end();
   }else{
     callback('Given parameters were missing or invalid')
   }
 } 
















 //Export the module
 module.exports = helpers