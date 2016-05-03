'use strict';
/**
 * Load Module Dependencies
 */
const url = require('url');

const router = require('koa-router')();
const debug  = require('debug')('router:apis');
const moment = require('moment');
const request = require('co-request');
const _       = require('lodash');

const NodeModel = require('../models/node');

router.get('/add', function *(next) {
  debug('Add an API');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  try {

    let nodes = yield NodeModel.find({}).exec();

    yield this.render('apis/add',{
      title: 'Dashy | API',
      admin: session._user,
      nodes: nodes,
      errors: errors
    });
  } catch(ex) {
    yield this.render('error');

  }

});

router.post('/add', function* (next) {
  debug('Add an API');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;

  this.checkBody('node')
    .notEmpty('Node cannot be empty');
  this.checkBody('upstream_url')
    .notEmpty('Upstream URL cannot be empty');

  if(this.errors) {
    let msg = '';
    for(let error of this.errors) {
      for(let key of Object.keys(error)) {
        msg += `${key}: ${error[key]}<-->`;
      }
    }


    this.session.errors = msg;

    this.redirect('/apis/add');

    return;
  }

  // meh!
  if(body.node === 'default') {
    let msg = 'node: Please select a node';

    this.session.errors = msg;

    this.redirect('/apis/add');
    return;
  }

  try {

    body = _.omitBy(body, _.isEmpty);

    // Casting for the new movie
    if(body.preserve_host) body.preserve_host = !body.preserve_host;
    if(body.strip_request_path) body.strip_request_path = !body.strip_request_path;

    let node = yield NodeModel.findById(body.node).exec();

    delete body.node;

    let addURL = url.resolve(node.url, '/apis/');

    let response = yield request({
      uri: addURL,
      method: 'POST',
      json: true,
      body: body
    });

    this.redirect('/apis/list');

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/apis/add');
  }
});

router.get('/list', function *(next) {
  debug('List APIs');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }


  try {
    let nodes = yield NodeModel.find({}).exec();
    let query = this.query;
    let apis = [];

    if(nodes.length) {
      if(query && query.node && (query.node !== 'default')) {
        let node = yield NodeModel.findById(query.node).exec();
        let apisUrl = url.resolve(node.url, '/apis/');
        let response = yield request(apisUrl);
        let body = JSON.parse(response.body);

        apis = body.data;
      } else {
        let node = nodes[0];
        let apisUrl = url.resolve(node.url, '/apis');
        let response = yield request(apisUrl);
        let body = JSON.parse(response.body);

        apis = body.data;
      }
    }

    yield this.render('apis/list',{
      title: 'Dashy | API',
      admin: session._user,
      nodes: nodes,
      apis: apis,
      moment: moment
    });

  } catch(ex) {
    this.render('error');

  }
});

router.get('/update', function *(next) {
  debug('Update an API');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  try {

    let nodes = yield NodeModel.find({}).exec();
    let apis = [];
    for(let node of nodes) {
      let apisUrl = url.resolve(node.url, '/apis');
      let response = yield request(apisUrl);
      let body = JSON.parse(response.body);

      let nodeInfo = { name: node.name, apis: [] };

      for(let api of body.data) {
        nodeInfo.apis.push({
          name: api.name,
          id: api.id
        });
      }

      apis.push(nodeInfo);

    }

    yield this.render('apis/update',{
      title: 'Dashy | API',
      admin: session._user,
      nodes: nodes,
      apis: apis,
      errors: errors
    });
  } catch(ex) {
    yield this.render('error');
  }
});

router.post('/update', function* (next) {
  debug('Update an API');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;

  this.checkBody('node')
    .notEmpty('Node cannot be empty');
  this.checkBody('api')
    .notEmpty('API cannot be empty');

  if(this.errors) {
    let msg = '';
    for(let error of this.errors) {
      for(let key of Object.keys(error)) {
        msg += `${key}: ${error[key]}<-->`;
      }
    }


    this.session.errors = msg;

    this.redirect('/apis/update');

    return;
  }

  // meh!
  if(body.node === 'default') {
    let msg = 'node: Please select a node';

    this.session.errors = msg;

    this.redirect('/apis/update');
    return;
  }
  if(body.api === 'default') {
    let msg = 'API: Please select an api';

    this.session.errors = msg;

    this.redirect('/apis/update');
    return;
  }

  try {

    body = _.omitBy(body, _.isEmpty);

    // Casting for the new movie
    if(body.preserve_host) body.preserve_host = !body.preserve_host;
    if(body.strip_request_path) body.strip_request_path = !body.strip_request_path;

    let node = yield NodeModel.findById(body.node).exec();
    let updateURL = url.resolve(node.url, `/apis/${body.api}`);

    delete body.api;
    delete body.node;

    let response = yield request({
      method: 'PATCH',
      json: true,
      body: body,
      uri: updateURL
    });

    this.redirect('/apis/list');

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/apis/update');
  }
});

router.get('/upsert', function *(next) {
  debug('Upsert an API');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  try {

    let nodes = yield NodeModel.find({}).exec();

    yield this.render('apis/upsert',{
      title: 'Dashy | API',
      admin: session._user,
      nodes: nodes,
      errors: errors
    });
  } catch(ex) {
    yield this.render('error');
  }

});

router.post('/upsert', function* (next) {
  debug('Upsert an API');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;

  this.checkBody('node')
    .notEmpty('Node cannot be empty');

  if(this.errors) {
    let msg = '';
    for(let error of this.errors) {
      for(let key of Object.keys(error)) {
        msg += `${key}: ${error[key]}<-->`;
      }
    }


    this.session.errors = msg;

    this.redirect('/apis/upsert');

    return;
  }

  // meh!
  if(body.node === 'default') {
    let msg = 'node: Please select a node';

    this.session.errors = msg;

    this.redirect('/apis/upsert');
    return;
  }

  try {

    body = _.omitBy(body, _.isEmpty);

    // Casting for the new movie
    if(body.preserve_host) body.preserve_host = !body.preserve_host;
    if(body.strip_request_path) body.strip_request_path = !body.strip_request_path;

    let node = yield NodeModel.findById(body.node).exec();

    delete body.node;

    let upsertURL = url.resolve(node.url, '/apis/');

    let response = yield request({
      uri: upsertURL,
      method: 'PUT',
      json: true,
      body: body
    });

    this.redirect('/apis/list');

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/apis/upsert');
  }
});

router.get('/remove', function *(next) {
  debug('Remove an API');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let errors = session.errors ? session.errors : undefined;
  this.session.errors = null;

  try {

    let nodes = yield NodeModel.find({}).exec();
    let apis = [];
    for(let node of nodes) {
      let apisUrl = url.resolve(node.url, '/apis');
      let response = yield request(apisUrl);
      let body = JSON.parse(response.body);

      let nodeInfo = { name: node.name, apis: [] };

      for(let api of body.data) {
        nodeInfo.apis.push({
          name: api.name,
          id: api.id
        });
      }

      apis.push(nodeInfo);

    }

    yield this.render('apis/remove',{
      title: 'Dashy | API',
      admin: session._user,
      nodes: nodes,
      apis: apis,
      errors: errors
    });
  } catch(ex) {
    yield this.render('error');
  }
});

router.post('/remove', function* (next) {
  debug('Remove an API');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;

  this.checkBody('node')
    .notEmpty('Node cannot be empty');
  this.checkBody('api')
    .notEmpty('API cannot be empty');

  if(this.errors) {
    let msg = '';
    for(let error of this.errors) {
      for(let key of Object.keys(error)) {
        msg += `${key}: ${error[key]}<-->`;
      }
    }


    this.session.errors = msg;

    this.redirect('/apis/remove');

    return;
  }

  // meh!
  if(body.node === 'default') {
    let msg = 'node: Please select a node';

    this.session.errors = msg;

    this.redirect('/apis/remove');
    return;
  }
  if(body.api === 'default') {
    let msg = 'API: Please select an api';

    this.session.errors = msg;

    this.redirect('/apis/remove');
    return;
  }

  try {

    let node = yield NodeModel.findById(body.node).exec();
    let deleteURL = url.resolve(node.url, `/apis/${body.api}`);

    let response = yield request({
      method: 'DELETE',
      json: true,
      body: {},
      uri: deleteURL
    });

    this.redirect('/apis/list');

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/apis/remove');
  }
});

module.exports = router;
