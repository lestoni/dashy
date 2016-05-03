'use strict';
/**
 * Load Module Dependencies
 *
 */

let url = require('url');

const router = require('koa-router')();
const debug  = require('debug')('dashy:home-router');
const request = require('co-request');
const moment = require('moment');

const User  = require('../models/user');
const NodeModel = require('../models/node');
const StatModel = require('../models/node-stat');

router.get('/', function* (next) {
  let session = this.session;

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  if(session._user) {
    this.redirect('/dashboard');
    return

  } else {
    yield this.render('login',{
      title: 'Dashy',
      errors: errors
    });

  }

});

router.get('logout', function* (next) {
  delete this.session._user;

  this.redirect('/');

});

router.post('login', function* loginUser(next) {
  debug('Login user');

  let errMessages = {
    username: [
      'Seriously this username again',
      'Who taught you how to type incorrect usernames',
      'The email has a bug from the past',
      'Close this tab and leave'
    ],password: [
      'The force is not with you according to the password you have used',
      'The password has esteem issues',
      'Even the admin has left his post because of this password',
      'Well done Champ, the password is soo wrong!!'
    ]
  };

  try {
    let body = this.request.body;
    let user = yield User.findOne({ username: body.username }).exec();
    if(!user) {
      this.session.errors = errMessages.username[Math.floor(Math.random() * errMessages.username.length)];
      this.redirect('/');
      return;
    }

    let isMatch = yield user.verifyPassword(body.password);
    if(!isMatch) {
      this.session.errors = errMessages.password[Math.floor(Math.random() * errMessages.password.length)];
      this.redirect('/');
      return;
    }

    let now = moment();
    let currentYear = now.year();
    let currentMonth = now.format('MMM');

    let nodes = yield NodeModel.find({}).exec();

    for(let node of nodes) {
      try {
        let statusUrl = url.resolve(node.url, '/status');
        let response = yield request(statusUrl);
        let body = JSON.parse(response.body);

        let totalRequests = +body.server.total_requests;

        let stat = yield StatModel.findOne({ year: currentYear, node: node._id }).exec();
        if(!stat) {
          stat = yield (new StatModel({ node: node._id })).save();
        }

        if(stat.year !== currentYear) {
          stat = yield (new StatModel({ node: node._id })).save();
        }

        let update = { $set : {}};
        update.$set[`requests.${currentMonth}`] = totalRequests;

        stat = yield StatModel.findOneAndUpdate({ _id: stat._id }, update, { 'new': true });
        totalRequests = 0;

        for(let month of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
          totalRequests += stat.requests[month];
        }


        update = { $set : {}};
        update.$set.total_requests = totalRequests;

        stat = yield StatModel.findOneAndUpdate({ _id: stat._id }, update);

      } catch(ex) {
        console.log(ex);
        // Meh
      }
    }

    this.session._user = { username: user.username };

    this.redirect('/dashboard');

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/');

  }

});

module.exports = router;
