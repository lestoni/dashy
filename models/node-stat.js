'use strict';
// NodeStat Model Definiton.

/**
 * Load Module Dependencies.
 */
const mongoose  = require('mongoose');
const moment    = require('moment');

var Schema = mongoose.Schema;

// New nodeStat Schema Instance
var NodeStatSchema = new Schema({
  node:             { type: Schema.Types.ObjectId, ref: 'Node' },
  year:             { type: Number },
  requests: {
    Jan: { type: Number, default: 0 },
    Feb: { type: Number, default: 0 },
    Mar: { type: Number, default: 0 },
    Apr: { type: Number, default: 0 },
    May: { type: Number, default: 0 },
    Jun: { type: Number, default: 0 },
    Jul: { type: Number, default: 0 },
    Aug: { type: Number, default: 0 },
    Sep: { type: Number, default: 0 },
    Oct: { type: Number, default: 0 },
    Nov: { type: Number, default: 0 },
    Dec: { type: Number, default: 0 }
  },
  total_requests: { type: Number, default: 0 },
  date_created:     { type: Date },
  last_modified:    { type: Date }
});

/**
 * Model Attributes to expose
 */
NodeStatSchema.statics.attributes = {
  node: 1,
  year: 1,
  requests: 1,
  url: 1,
  total_requests: 1,
  date_created: 1,
  last_modified: 1
};

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 */
NodeStatSchema.pre('save', function preSaveMiddleware(next) {
  let nodeStat = this;

  // set date modifications
  let now = moment().toISOString();

  nodeStat.date_created = now;
  nodeStat.last_modified = now;
  nodeStat.year          = moment(now).year();

  next();

});

// Expose nodeStat model
module.exports = mongoose.model('NodeStat', NodeStatSchema);
