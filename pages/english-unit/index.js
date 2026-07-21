const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开英语单元',
  resolveItem: (options) => ({
    subjectId: 'english',
    type: 'unit',
    id: options.id,
    focusType: options.focusType,
    focusId: options.focusId,
  }),
}));
