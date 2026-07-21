const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开方法模板',
  resolveItem: (options) => ({ subjectId: options.subjectId || 'math', type: 'template', id: options.id }),
}));
