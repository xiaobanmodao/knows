const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开学科内容',
  resolveItem: (options) => ({ subjectId: options.id || options.subjectId || 'math', type: 'subject' }),
}));
