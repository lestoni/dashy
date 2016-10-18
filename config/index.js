'use strict';

/**
 * Load Module dependencies.
 */
const path = require('path');

const env = process.env;

const PORT            = normalizePort(env.DASHY_NODE_PORT || '7500');
const MONGODB_URL     = env.MONGODB_URL || 'mongodb://127.0.0.1:27017/dashy-kong';
const ADMIN_USERNAME  = 'admin' || env.DASHY_ADMIN_USERNAME;
const ADMIN_PASS      = 'password' || env.DASHY_ADMIN_PASS;

let config = {

  SESSION_KEYS: ['sessionkey1', 'sessionkey2' ],

  PORT: PORT,

  // MongoDB URL
  MONGODB: {
    URL: MONGODB_URL,
    OPTS: {
      server:{
        auto_reconnect:true
      }
    }
  },

  SALT_FACTOR: 12,

  TOKEN: {
    RANDOM_BYTE_LENGTH: 32
  },
  ADMIN: {
    USERNAME: ADMIN_USERNAME,
    PASS: ADMIN_PASS
  }
};

module.exports = config;

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
