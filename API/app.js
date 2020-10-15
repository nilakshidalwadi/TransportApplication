var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql');
var cors = require('cors');
const _ = require('lodash');

// module variables
const config = require('./config.json');
const defaultConfig = config.development;
const environment = process.env.NODE_ENV || config.currentConfig;
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);

// Set timezone as adelaide
process.env.TZ = 'Australia/Adelaide';

// as a best practice
// all global variables should be referenced via global. syntax
// and their names should always begin with g
global.gConfig = finalConfig;

var users = require('./routes/users');
var truck = require('./routes/truck');
var report = require('./routes/report');
var trip = require('./routes/trip');
var upload = require('./routes/upload');
var jobtype = require('./routes/jobtype');

// Authentication
const expressJwt = require('express-jwt');
const secretKey = gConfig.secretKey;

// connection to http server
const https = require('https');

var compression = require('compression');
var app = express();
const fs = require('fs');

const mySqlPool = mysql.createPool({
  connectionLimit: gConfig.database.connectionLimit,
  host: gConfig.database.host,
  user: gConfig.database.user,
  password: gConfig.database.password,
  database: gConfig.database.database,
  dateStrings: true,
  multipleStatements: true
});

// compress all responses
app.use(compression());

app.use(cors());
app.use(logger('dev'));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Authentication
app.use(
  expressJwt({ secret: secretKey }).unless({ path: ['/api/v1/users/login'] })
);
app.get('/api/v1/checkAuth', function(req, res, next) {
  res.send({ status: 200 });
});

// Set response type
app.use(function(req, res, next) {
  // return response in json format
  res.setHeader('Content-Type', 'application/json');

  next();
});

//Database connection
app.use(function(req, res, next) {
  try {
    // provide sql connection to all the request
    global.gPool = mySqlPool;
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

app.use('/api/v1/upload', upload);

app.use('/api/v1/users', users);
app.use('/api/v1/truck', truck);
app.use('/api/v1/report', report);
app.use('/api/v1/trip', trip);
app.use('/api/v1/jobtype', jobtype);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = environment === 'development' ? err : {};

  // error
  res.status(err.status || 500);
  res.send(
    JSON.stringify({
      status: err.status || 500,
      error: res.locals.error,
      response: null
    })
  );
});

module.exports = app;

https
  .createServer(
    {
      key: fs.readFileSync(gConfig.certificate.key),
      cert: fs.readFileSync(gConfig.certificate.cert)
    },
    app
  )
  .listen(global.gConfig.node_port, () => {
    console.log(
      `${global.gConfig.app_name} listening on port ${global.gConfig.node_port}`
    );
  });
