const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开数学',
  resolveItem: () => ({ subjectId: 'math', type: 'subject' }),
}));
