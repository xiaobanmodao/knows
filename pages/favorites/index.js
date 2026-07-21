const { SUBJECT_LABELS } = require('../../data/subject-manifest');
const { openContent } = require('../../utils/content-routes');

function hydrateItem(item) {
  const subjectId = item.subjectId || 'math';
  const type = item.type || 'knowledge';
  const typeLabels = { knowledge: '知识点', template: '方法模板', topic: '专题', chapter: '章节', unit: '教材单元' };
  return {
    ...item,
    subjectId,
    type,
    subjectLabel: SUBJECT_LABELS[subjectId] || '数学',
    typeLabel: typeLabels[type] || '内容',
  };
}

Page({
  data: {
    favorites: [],
    recents: [],
  },

  onShow() {
    const app = getApp();
    app.refreshSession();
    this.setData({
      favorites: app.globalData.favorites.map(hydrateItem),
      recents: app.globalData.recents.map(hydrateItem),
    });
  },

  openItem(event) {
    const { id, subjectId, type } = event.currentTarget.dataset;
    openContent({ id, subjectId, type });
  },
});
