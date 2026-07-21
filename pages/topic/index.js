const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开专题',
  resolveItem: (options) => ({ subjectId: options.subjectId || 'math', type: 'topic', id: options.id }),
}));
