'use strict';

/**
 * User Model Definition.
 */

/**
 * Load Module Dependencies.
 */
const mongoose  = require('mongoose');
const moment    = require('moment');
const bcrypt    = require('bcrypt');

const config    = require('../config');

var Schema = mongoose.Schema;

// New User Schema Instance
var UserSchema = new Schema({
  username:       { type: String },
  realm:          { type: String, default: 'user' },
  role:           { type: String, default: 'admin' },
  password:       { type: String },
  last_login:     { type: Date },
  date_created:   { type: Date },
  last_modified:  { type: Date }
});

/**
 * Model attributes to expose
 */
UserSchema.statics.attributes = {
  username: 1,
  last_login: 1,
  date_created: 1,
  last_modified: 1,
  role:   1,
  realm: 1
};

/**
 * Verify the submitted password against the stored one
 *
 * @param {String} password submitted password
 * @param {Function} cb Callback function
 */
UserSchema.methods.verifyPassword = function verifyPassword(passwd) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(passwd, this.password, (err, isMatch) => {
      if(err) {
        return reject(err);
      }

      resolve(isMatch);
    });
  });
};

/**
 * Pre save middleware.
 *
 * @desc Sets the date_created, hashes new Password and last_modified attributes prior to save
 *
 * @param {Function} next middleware dispatcher
 */
UserSchema.pre('save', function preSave(next) {
  let model = this;

  // Hash Password
  UserSchema.statics.hashPasswd(model.password, (err, hash) => {
    if(err) {
      return next(err);
    }

    // set date modifications
    let now = moment().toISOString();

    model.password = hash;

    model.date_created = now;
    model.last_modified = now;
    model.last_login = now;

    next();
  });


});

UserSchema.statics.hashPasswd = function (passwd, cb) {

  let createHash = (err, hash) => {
    if(err) {
      return cb(err);
    }

    cb(null, hash);
  };

  let generateSalt = (err, salt) => {
    if(err) {
      return cb(err);
    }

    // Hash the password using the generated salt
    bcrypt.hash(passwd, salt, createHash);

  };

  // Generate a salt factor
  bcrypt.genSalt(config.SALT_FACTOR, generateSalt);
};

// Expose the User Model
module.exports = mongoose.model('User', UserSchema);
