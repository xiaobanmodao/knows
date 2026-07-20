const { getFeaturedChapters, getAllChapters } = require('../../utils/math');
const { getSubjectRegistry, SUBJECT_LABELS } = require('../../utils/subjects');

Page({
  data: {
    subjects: [],
    featuredChapters: [],
    totalChapters: 0,
    favoritesCount: 0,
    recentsCount: 0,
    totalKnowledge: 0,
    continueReading: null,
  },

  onLoad() {
    const subjects = getSubjectRegistry();
    this.setData({
      subjects,
      featuredChapters: getFeaturedChapters(),
      totalChapters: getAllChapters().length,
      totalKnowledge: subjects.reduce((sum, subject) => (
        sum + subject.knowledgeCount + (subject.vocabularyCount || 0) + (subject.grammarCount || 0)
      ), 0),
    });
  },

  onShow() {
    const app = getApp();
    app.refreshSession();
    this.setData({
      favoritesCount: app.globalData.favorites.length,
      recentsCount: app.globalData.recents.length,
      continueReading: (() => {
        const item = app.getLastReading();
        return item ? { ...item, subjectLabel: SUBJECT_LABELS[item.subjectId || 'math'] || '数学' } : null;
      })(),
    });
  },

  openContinueReading() {
    const item = this.data.continueReading;

    if (item) {
      wx.navigateTo({
        url: `/pages/knowledge/index?subjectId=${item.subjectId || 'math'}&id=${item.id}&restore=1`,
      });
    }
  },

  openSearch() {
    wx.navigateTo({
      url: '/pages/search/index',
    });
  },

  openSubject(event) {
    const subject = event.detail;

    if (subject.id === 'math') {
      wx.navigateTo({
        url: '/pages/math/index',
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/subject/index?id=${subject.id}`,
    });
  },

  openChapter(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/chapter/index?id=${id}`,
    });
  },

  openFavorites() {
    wx.switchTab({
      url: '/pages/favorites/index',
    });
  },

  openProfile() {
    wx.switchTab({
      url: '/pages/profile/index',
    });
  },
});
