/*
 * Primary file for API
 */

 //Dependencies

 var server = require('./lib/server.js');
 var workers = require('./lib/workers.js')

 //Declare the app
 var app = {};

 //Init Function

 app.init = function(){
   //Start the server
   server.init();

   //Start the workers
   workers.init();

 };

 //Execute
 app.init();

 //Export the app
 module.exports = app;
