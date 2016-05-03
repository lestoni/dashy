'use strict';
/**
 * Load Module Dependencies
 */
const url  = require('url');

const router = require('koa-router')();
const debug  = require('debug')('router:consumers');
const request = require('co-request');
const _      = require('lodash');
const moment = require('moment');

const NodeModel = require('../models/node');

router.get('/add', function *(next) {
  debug('Add an Consumer');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  try {

    let nodes = yield NodeModel.find({}).exec();

    yield this.render('consumers/add',{
      title: 'Dashy | Consumer',
      admin: session._user,
      nodes: nodes,
      errors: errors
    });
  } catch(ex) {
    yield this.render('error');

  }

});

router.post('/add', function* (next) {
  debug('Add a Consumer');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;
  body = _.omitBy(body, _.isEmpty);

  // meh!
  if(body.node === 'default') {
    let msg = 'node: Please select a node';

    this.session.errors = msg;

    this.redirect('/consumers/add');
    return;
  }

  // meh!
  if(!body.custom_id && !body.username ) {
    let msg = 'Please set either a username or a custom id';

    this.session.errors = msg;

    this.redirect('/consumers/add');
    return;
  }

  try {

    let node = yield NodeModel.findById(body.node).exec();

    delete body.node;

    let addURL = url.resolve(node.url, '/consumers/');

    let response = yield request({
      uri: addURL,
      method: 'POST',
      json: true,
      body: body
    });

    this.redirect('/consumers/list');

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/consumers/add');
  }
});

// TODO take care of users
router.get('/list', function *(next) {
  debug('List consumers');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  try {
    let nodes = yield NodeModel.find({}).exec();
    let query = this.query;
    let consumers = [];

    if(nodes.length) {
      if(query && query.node && (query.node !== 'default')) {
        let node = yield NodeModel.findById(query.node).exec();
        let apisUrl = url.resolve(node.url, '/consumers/');
        let response = yield request(apisUrl);
        let body = JSON.parse(response.body);

        consumers = body.data;
      } else {
        let node = nodes[0];
        let apisUrl = url.resolve(node.url, '/consumers/');
        let response = yield request(apisUrl);
        let body = JSON.parse(response.body);

        consumers = body.data;
      }
    }


    yield this.render('consumers/list',{
      title: 'Dashy | Consumer',
      admin: session._user,
      nodes: nodes,
      consumers: consumers,
      moment: moment
    });
  } catch(ex) {
    yield this.render('error');
  }
});

router.get('/update', function *(next) {
  debug('Update an Consumer');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  try {

    let nodes = yield NodeModel.find({}).exec();

    yield this.render('consumers/update',{
      title: 'Dashy | Consumer',
      admin: session._user,
      nodes: nodes,
      errors: errors
    });

  } catch(ex) {
    yield this.render('error');

  }
});

router.post('/update', function* (next) {
  debug('Update Consumer');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;

  this.checkBody('node')
    .notEmpty('Node cannot be empty');
  this.checkBody('id')
    .notEmpty('Unique ID cannot be empty');

  if(this.errors) {
    let msg = '';
    for(let error of this.errors) {
      for(let key of Object.keys(error)) {
        msg += `${key}: ${error[key]}<-->`;
      }
    }


    this.session.errors = msg;

    this.redirect('/consumers/update');

    return;
  }


  // meh!
  if(body.node === 'default') {
    let msg = 'node: Please select a node';

    this.session.errors = msg;

    this.redirect('/consumers/update');
    return;
  }

  try {

    body = _.omitBy(body, _.isEmpty);

    let node = yield NodeModel.findById(body.node).exec();

    let updateURL = url.resolve(node.url, `/consumers/${body.id}`);

    delete body.node;
    delete body.id;

    let response = yield request({
      uri: updateURL,
      method: 'PATCH',
      json: true,
      body: body || {}
    });

    // /consumers/list?node=<THE_MAGNIFICIENT_BLEUGH_MONGO_ID>
    this.redirect('/consumers/list');

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/consumers/update');
  }
});

router.get('/upsert', function *(next) {
  debug('Create or Update a Consumer');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  try {

    let nodes = yield NodeModel.find({}).exec();

    yield this.render('consumers/upsert',{
      title: 'Dashy | Consumer',
      admin: session._user,
      nodes: nodes,
      errors: errors
    });

  } catch(ex) {
    yield this.render('error');

  }

});

router.post('/upsert', function* (next) {
  debug('Create or Update a Consumer');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;
  body = _.omitBy(body, _.isEmpty);

  // meh!
  if(body.node === 'default') {
    let msg = 'node: Please select a node';

    this.session.errors = msg;

    this.redirect('/consumers/upsert');
    return;
  }

  // meh!
  if(!body.custom_id && !body.username ) {
    let msg = 'Please set either a username or a custom id';

    this.session.errors = msg;

    this.redirect('/consumers/upsert');
    return;
  }

  try {

    let node = yield NodeModel.findById(body.node).exec();

    delete body.node;

    let upsertURL = url.resolve(node.url, '/consumers/');

    let response = yield request({
      uri: upsertURL,
      method: 'PUT',
      json: true,
      body: body
    });

    this.redirect('/consumers/list');

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/consumers/upsert');
  }

});

router.get('/remove', function *(next) {
  debug('Remove an Consumer');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  try {

    let nodes = yield NodeModel.find({}).exec();

    yield this.render('consumers/remove',{
      title: 'Dashy | Consumer',
      admin: session._user,
      nodes: nodes,
      errors: errors
    });

  } catch(ex) {
    yield this.render('error');
  }

});

router.post('/remove', function* (next) {
  debug('Remove a Consumer');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;
  body = _.omitBy(body, _.isEmpty);

  // meh!
  if(body.node === 'default') {
    let msg = 'node: Please select a node';

    this.session.errors = msg;

    this.redirect('/consumers/remove');
    return;
  }

  // meh!
  if(!body.identifier ) {
    let msg = 'Please set either a username or a custom id';

    this.session.errors = msg;

    this.redirect('/consumers/remove');
    return;
  }

  try {

    let node = yield NodeModel.findById(body.node).exec();

    delete body.node;

    let removeURL = url.resolve(node.url, `/consumers/${body.identifier}`);

    let response = yield request({
      uri: removeURL,
      method: 'DELETE'
    });

    this.redirect('/consumers/list');

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/consumers/remove');
  }
});

module.exports = router;
