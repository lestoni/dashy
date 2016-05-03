'use strict';
// Node Model Definiton.

/**
 * Load Module Dependencies.
 */
const mongoose  = require('mongoose');
const moment    = require('moment');

var Schema = mongoose.Schema;

// New Node Schema Instance
var NodeSchema = new Schema({
  name:             { type: String },
  url:              { type: String },
  date_created:     { type: Date },
  last_modified:    { type: Date }
});

/**
 * Model Attributes to expose
 */
NodeSchema.statics.attributes = {
  name: 1,
  url: 1,
  date_created: 1,
  last_modified: 1
};

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 */
NodeSchema.pre('save', function preSaveMiddleware(next) {
  let node = this;

  // set date modifications
  let now = moment().toISOString();

  node.date_created = now;
  node.last_modified = now;

  next();

});

// Expose Node model
module.exports = mongoose.model('Node', NodeSchema);
