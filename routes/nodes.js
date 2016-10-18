'use strict';
/**
 * Load Module Dependencies
 */
const url = require('url');

const router = require('koa-router')();
const debug  = require('debug')('router:nodes');
const request = require('co-request');

const NodeModel = require('../models/node');
const StatModel = require('../models/node-stat');

router.get('/info', function* (next) {
  debug('node info');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }
  console.log(session);

  try {
    let nodes = yield NodeModel.find({}).exec();
    let info = [];

    for(let node of nodes) {
      try {
        let response = yield request(node.url);
        let body = JSON.parse(response.body);
        body.node_name = node.name;

        info.push(body);
      } catch(ex) {
        // meh
      }
    }

    yield this.render('nodes/info',{
      title: 'Dashy | Nodes',
      admin: session._user,
      info: info
    });

  } catch(ex) {
    yield this.render('error');
  }

});

router.get('/status', function* (next) {
  debug('node status');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  try {
    let nodes = yield NodeModel.find({}).exec();
    let info = [];

    for(let node of nodes) {
      try {
        let statusUrl = url.resolve(node.url, '/status');
        let response = yield request(statusUrl);
        let body = JSON.parse(response.body);
        body.node_name = node.name;

        info.push(body);
      } catch(ex) {
        console.log(ex);
        // meh
      }
    }

    yield this.render('nodes/status',{
      title: 'Dashy | Nodes',
      admin: session._user,
      nodes: info
    });


  } catch(ex) {
    yield this.render('error');
  }

});

router.get('/add', function* (next) {
  debug('add a node');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  yield this.render('nodes/add',{
    title: 'Dashy | Nodes',
    admin: session._user,
    errors: errors
  });

});

router.post('/add', function* addNode(next) {
  debug('node status');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;

  this.checkBody('url')
    .notEmpty('URL cannot be empty');
  this.checkBody('name')
    .notEmpty('Name cannot be empty');


  if(this.errors) {
    let msg = '';
    for(let error of this.errors) {
      for(let key of Object.keys(error)) {
        msg += `${key}: ${error[key]}<-->`;
      }
    }

    this.session.errors = msg;

    this.redirect('/nodes/add');

    return;
  }

  try {
    let node = yield NodeModel.findOne(body).exec();
    let stat;

    if(!node) {
      node = yield (new NodeModel(body)).save();
      stat = yield (new StatModel({ node: node._id })).save();
    }

    this.redirect('/nodes/info');

  } catch(ex) {
    this.session.err = 'The System Admin Fell asleep again, sigh!!';

    this.redirect('/nodes/add');

  }

});

module.exports = router;
