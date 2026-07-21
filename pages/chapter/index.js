const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开数学章节',
  resolveItem: (options) => ({ subjectId: 'math', type: 'chapter', id: options.id }),
}));
