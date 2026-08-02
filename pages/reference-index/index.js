const { buildCatalogRoute } = require('../../utils/catalog-routes');
const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开知识索引',
  resolveUrl: (options) => buildCatalogRoute('referenceIndex', { kind: options.kind }),
}));
