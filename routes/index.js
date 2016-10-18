'use strict';

/**
 * Load Module Dependencies
 */
const Router = require('koa-router');
const debug  = require('debug')('dashy:api-router');

const homeRouter      = require('./home');
const dashboardRouter = require('./dashboard');
const consumersRouter = require('./consumers');
const apisRouter      = require('./apis');
const nodesRouter     = require('./nodes');
const pluginsRouter   = require('./plugins');
const clustersRouter   = require('./clusters');

let appRouter = new Router();

composeRoute('', homeRouter);
composeRoute('dashboard', dashboardRouter);
composeRoute('consumers', consumersRouter);
composeRoute('apis', apisRouter);
composeRoute('nodes', nodesRouter);
composeRoute('plugins', pluginsRouter);
composeRoute('clusters', clustersRouter);

function composeRoute(endpoint, router) {
  appRouter.use(`/${endpoint}`, router.routes(), router.allowedMethods());
}

module.exports = appRouter;
