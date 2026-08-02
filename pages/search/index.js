const { buildCatalogRoute } = require('../../utils/catalog-routes');
const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开搜索',
  resolveUrl: (options) => buildCatalogRoute('search', {
    q: options.q,
    subjectId: options.subjectId,
  }),
}));
