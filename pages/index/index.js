const {
  FEATURED_MATH_CHAPTERS,
  getSubjectRegistry,
  SUBJECT_LABELS,
} = require('../../data/subject-manifest');
const { openContent } = require('../../utils/content-routes');

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
      featuredChapters: FEATURED_MATH_CHAPTERS,
      totalChapters: subjects[0].chapterCount,
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
      openContent({ ...item, type: 'knowledge', restore: true });
    }
  },

  openSearch() {
    wx.navigateTo({
      url: '/pages/search/index',
    });
  },

  openSubject(event) {
    const subject = event.detail;

    openContent({ subjectId: subject.id, type: 'subject' });
  },

  openChapter(event) {
    const { id } = event.currentTarget.dataset;
    openContent({ subjectId: 'math', type: 'chapter', id });
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
