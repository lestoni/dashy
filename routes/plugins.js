'use strict';
/**
 * Load Module Dependencies
 */
const url    = require('url');

const router = require('koa-router')();
const debug  = require('debug')('router:plugins');
const request = require('co-request');
const moment  = require('moment');
const _       = require('lodash');

const NodeModel = require('../models/node');

router.get('/add', function *(next) {
  debug('Add a Plugins');
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

    yield this.render('plugins/add',{
      title: 'Dashy | Plugins',
      admin: session._user,
      nodes: nodes,
      apis: apis,
      errors: errors
    });

  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/plugins/add');

  }
});

router.post('/add', function* (next) {
  debug('Add a Plugin');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  let body = this.request.body;

  body = _.omitBy(body, _.isEmpty);

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

    this.redirect('/plugins/add');

    return;
  }

  // meh!
  if(body.node === 'default') {
    let msg = 'node: Please select a node';

    this.session.errors = msg;

    this.redirect('/plugins/add');
    return;
  }
  if(body.api === 'default') {
    let msg = 'API: Please select an api';

    this.session.errors = msg;

    this.redirect('/plugins/add');
    return;
  }

  try {

    let node = yield NodeModel.findById(body.node).exec();

    body.config = JSON.parse(body.config);

    let addURL = url.resolve(node.url, `/apis/${body.api}/plugins`);

    delete body.api;
    delete body.node;

    let response = yield request({
      method: 'POST',
      json: true,
      body: body,
      uri: addURL
    });

    if(response.statusCode !== 201) {
      this.session.errors = response.body.config;

      this.redirect('/plugins/add');
    } else {
      this.redirect('/plugins/add');
    }


  } catch(ex) {
    this.session.errors = ex.message;

    this.redirect('/plugins/add');

  }

});

router.get('/list/all', function *(next) {
  debug('List Plugins');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  try {
    let nodes = yield NodeModel.find({}).exec();
    let query = this.query;
    let plugins = [];

    if(nodes.length) {
      if(query && query.node && (query.node !== 'default')) {
        let node = yield NodeModel.findById(query.node).exec();
        let pluginsUrl = url.resolve(node.url, '/plugins/');
        let response = yield request(pluginsUrl);
        let body = JSON.parse(response.body);

        plugins = body.data;

      } else {
        let node = nodes[0];
        let pluginsUrl = url.resolve(node.url, '/plugins/');
        let response = yield request(pluginsUrl);
        let body = JSON.parse(response.body);

        plugins = body.data;

      }

    }

    yield this.render('plugins/list',{
      title: 'Dashy | Plugins ',
      admin: session._user,
      nodes: nodes,
      plugins: plugins,
      moment: moment
    });
  } catch(ex) {
    this.render('error');
  }
});


router.get('/list/api', function *(next) {
  debug('List Plugins');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  try {
    let nodes = yield NodeModel.find({}).exec();
    let query = this.query;
    let plugins = [];
    let apis = [];

    if(nodes.length) {
      if(query) {
        if((query.node && (query.node !== 'default')) && (query.api && (query.api !== 'default'))) {
          let node = yield NodeModel.findById(query.node).exec();
          let pluginsUrl = url.resolve(node.url, `/apis/${query.api}/plugins/`);
          let response = yield request(pluginsUrl);
          let body = JSON.parse(response.body);

          plugins = body.data;
        }
      }

      for(let node of nodes) {
        let apisUrl = url.resolve(node.url, '/apis/');
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

    }

    yield this.render('plugins/api',{
      title: 'Dashy | Plugins ',
      admin: session._user,
      nodes: nodes,
      plugins: plugins,
      moment: moment,
      apis: apis
    });

  } catch(ex) {
    this.render('error');
  }
});

router.get('/update', function *(next) {
  debug('Update a Plugins');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  yield this.render('plugins/update',{
    title: 'Dashy | Plugins',
    admin: session._user
  });
});

router.get('/upsert', function *(next) {
  debug('Create or Update a Plugins');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  yield this.render('plugins/upsert',{
    title: 'Dashy | Plugins',
    admin: session._user
  });
});

router.get('/remove', function *(next) {
  debug('Remove a Plugins');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  yield this.render('plugins/remove',{
    title: 'Dashy | Plugins',
    admin: session._user
  });
});

router.get('/retrieve/enabled', function *(next) {
  debug('Retrieve enabled plugins');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  yield this.render('plugins/enabled',{
    title: 'Dashy | Plugins',
    admin: session._user
  });
});

router.get('/retrieve/schema', function *(next) {
  debug('Retrieve plugin schema');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  yield this.render('plugins/schema',{
    title: 'Dashy | Plugins',
    admin: session._user,
  });
});

module.exports = router;
