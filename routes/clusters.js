'use strict';
/**
 * Load Module Dependencies
 */
const url    = require('url');

const router = require('koa-router')();
const debug  = require('debug')('router:clusters');
const request = require('co-request');
const moment  = require('moment');
const _      = require('lodash');

const NodeModel = require('../models/node');

router.get('/status', function *(next) {
  debug('Cluster status');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  try {

    let nodes = yield NodeModel.find({}).exec();
    let query = this.query;
    let clusterNodes = [];

    if(nodes.length) {
      if(query && query.node && (query.node !== 'default')) {
        let node = yield NodeModel.findById(query.node).exec();
        let clusterUrl = url.resolve(node.url, '/cluster/');
        let response = yield request(clusterUrl);
        let body = JSON.parse(response.body);

        clusterNodes = body.data;

      } else {
        let node = nodes[0];
        let clusterUrl = url.resolve(node.url, '/cluster/');
        let response = yield request(clusterUrl);
        let body = JSON.parse(response.body);

        clusterNodes = body.data;

      }
    }

    yield this.render('clusters/status',{
      title: 'Dashy | Cluster',
      admin: session._user,
      ns: nodes,
      nodes: clusterNodes
    });

  } catch(ex) {
    yield this.render('error');

  }
});

router.get('/remove', function *(next) {
  debug('Remove node from cluster');

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  yield this.render('clusters/remove',{
    title: 'Dashy | Cluster',
    admin: session._user
  });

});

module.exports = router;
