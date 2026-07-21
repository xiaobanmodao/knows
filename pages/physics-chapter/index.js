const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开物理章节',
  resolveItem: (options) => ({ subjectId: 'physics', type: 'chapter', id: options.id }),
}));
