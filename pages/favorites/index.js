const { SUBJECT_LABELS } = require('../../utils/subjects');

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
    let url = `/pages/knowledge/index?subjectId=${subjectId}&id=${id}`;

    if (type === 'unit') {
      url = `/pages/english-unit/index?id=${id}`;
    } else if (type === 'template') {
      url = `/pages/template/index?subjectId=${subjectId}&id=${id}`;
    } else if (type === 'topic') {
      url = `/pages/topic/index?subjectId=${subjectId}&id=${id}`;
    } else if (type === 'chapter') {
      url = subjectId === 'physics'
        ? `/pages/physics-chapter/index?id=${id}`
        : `/pages/chapter/index?id=${id}`;
    }

    wx.navigateTo({
      url,
    });
  },
});
