/*
 * Create and export configuration variable
 */ 

 //Containers for all the environment

 var environment = {};

 //Staging (default) environment
 environment.staging = {
   'httpPort' : 3000,
   'httpsPort' : 3001,
   'envName' : 'staging',
   'hashingSecret' : 'thisIsASecret',
   'maxChecks' : 5,
   'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  }
 };

 //Production environment
 environment.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'maxChecks' : 5,
  'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  }
 };

 //Determine which argument was passed as command line arguments
 var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLocaleLowerCase() : '';

 //Check current environment is defined or not. If not default is staging
 var environmentToExport = typeof(environment[currentEnvironment]) == 'object' ? environment[currentEnvironment] : environment.staging;

 module.exports = environmentToExport;