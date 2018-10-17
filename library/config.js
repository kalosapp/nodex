/*
 * Create and export configuration variable
 */ 

 //Containers for all the environment

 var environment = {};

 //Staging (default) environment
 environment.staging = {
   'httpPort' : 3000,
   'envName'  : 'staging',
   'dbUrl'    : 'mongodb://127.0.0.1/local_library'
 };

 //Production environment
 environment.production = {
  'httpPort' : 5000,
  'envName'  : 'production',
  'dbUrl'    : 'mongodb://127.0.0.1/local_library'
 };

 //Determine which argument was passed as command line arguments
 var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLocaleLowerCase() : '';

 //Check current environment is defined or not. If not default is staging
 var environmentToExport = typeof(environment[currentEnvironment]) == 'object' ? environment[currentEnvironment] : environment.staging;

 module.exports = environmentToExport;