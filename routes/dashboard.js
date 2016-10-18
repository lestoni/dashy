'use strict';
/**
 * Load Module Dependencies
 */
const url   = require('url');

const router = require('koa-router')();
const debug  = require('debug')('dashy:dashboard-router');
const request = require('co-request');
const randomColor = require('randomcolor');
const moment = require('moment');

const User      = require('../models/user');
const NodeModel = require('../models/node');
const StatModel = require('../models/node-stat');

router.get('/', function *(next) {

  let session = this.session;

  if(!session._user) {
    this.redirect('/');
    return;
  }

  try {

    let nodesInfo     = {};
    let status        = {};
    let totalRequests = 0;
    let currentYear   = moment().year();
    let datasets = [];

    let nodesCount = yield NodeModel.count({}).exec();
    let nodes  = yield NodeModel.find({}).exec();
    let stats = yield StatModel.find({}).exec();


    for(let stat of stats) {
      totalRequests += stat.total_requests;
    }

    for(let node of nodes) {
      try {
        let response = yield request(node.url);

        status[node.name] = 'success';

        let stat = yield StatModel.findOne({ year: currentYear, node: node._id }).exec();
        let monthly = [];
        for(let month of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
          monthly.push(stat.requests[month]);
        }
        let border = randomColor({ luminosity: 'dark', format: 'rgba' });
        let bg = randomColor({ luminosity: 'bright', format: 'rgba' });
        let dataset =  {
          label: node.name,
          backgroundColor: bg,
          borderColor: border,
          pointBorderColor: border,
          pointBackgroundColor: border,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointBorderWidth: 2,
          data: monthly
        };

        datasets.push(dataset);


      } catch(ex) {
        status[node.name] = 'error';

      }
    }

    nodesInfo = {
      count: nodesCount,
      total_requests: totalRequests,
      status: status,
      datasets: datasets
    };

    yield this.render('index', {
      title: 'Dashy',
      admin: session._user,
      nodes: nodesInfo,
      dashboard: true
    });

  } catch(ex) {
    yield this.render('error');

  }

});

module.exports = router;
