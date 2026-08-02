const { getPackageMeta } = require('../data/package-manifest');
const { appendQuery, openRoute } = require('./content-routes');

function getCatalogRoutes() {
  const catalog = getPackageMeta('catalog');
  return catalog ? catalog.routes : {};
}

function buildCatalogRoute(routeId, query = {}) {
  const route = getCatalogRoutes()[routeId];
  if (!route) throw new Error(`Unknown catalog route: ${routeId}`);
  return appendQuery(route, query);
}

function openCatalogRoute(routeId, query = {}, options = {}) {
  return openRoute(buildCatalogRoute(routeId, query), options);
}

module.exports = { buildCatalogRoute, openCatalogRoute };
