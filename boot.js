'use strict';

/**
 * Load Dependencies
 */
const config = require('./config');
const User   = require('./models/user');
const co     = require('co');

module.exports = function bootstrap(opts) {
  return co(function* () {
    let admin = yield User.findOne({ username: config.ADMIN.USERNAME, password: config.ADMIN.PASS }).exec();
    if(admin) {
      return admin;
    }

    admin = new User({
      username: config.ADMIN.USERNAME,
      password: config.ADMIN.PASS
    });

    admin = yield admin.save();

    return admin;
  });
};
