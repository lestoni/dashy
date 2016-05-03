'use strict';

/**
 * Module dependencies.
 */
const http    = require('http');

const app     = require('koa')();
const koa     = require('koa-router')();
const logger  = require('koa-logger');
const json    = require('koa-json');
const views   = require('koa-views');
const onerror = require('koa-onerror');
const debug   = require('debug')('dashy:server');
const mongoose = require('mongoose');
const session = require('koa-generic-session');
const MongoStore = require('koa-generic-session-mongo');
const validator = require('koa-validate');
const flash     = require('koa-flash');

const router    = require('./routes');
const config    = require('./config');
const bootstrap = require('./boot');

validator(app);

app.keys = config.SESSION_KEYS;

/**
 * Get port from environment and store in Express.
 */

const port = config.PORT;

// connect to MongoDB
mongoose.connect(config.MONGODB.URL, config.MONGODB.OPTS);

// MongoDB connection error Handler
mongoose.connection.on('error', () => {
  debug('responding to MongoDB connection error');
  console.error('MongoDB connection error. Please make sure MongoDB is running');

  process.exit(1);
});

bootstrap()
.then((info) => {
  console.log('Bootstrapping successful');
}).catch((err) => {
  console.log(err);
  process.exit(1);
});

app.use(session({
  store: new MongoStore()
}));
app.use(flash());

// global middlewares
app.use(views('views', {
  root: __dirname + '/views',
  default: 'ejs'
}));
app.use(require('koa-bodyparser')());
app.use(json());
app.use(logger());

app.use(function *(next){
  const start = new Date;
  yield next;
  const ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});

app.use(require('koa-static')(__dirname + '/public'));

// mount root routes
app.use(router.routes());

app.on('error', function(err, ctx){
  console.log(err);
  logger.error('server error', err, ctx);
});


/**
 * Create HTTP server.
 */

const server = http.createServer(app.callback());

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

module.exports = app;
