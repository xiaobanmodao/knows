const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开知识点',
  resolveItem: (options) => ({
    subjectId: options.subjectId || 'math',
    type: 'knowledge',
    id: options.id,
    restore: options.restore === '1',
  }),
}));
