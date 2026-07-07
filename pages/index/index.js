const { getFeaturedChapters, getAllChapters } = require('../../utils/math');

Page({
  data: {
    subjects: [],
    featuredChapters: [],
    totalChapters: 0,
    favoritesCount: 0,
    recentsCount: 0,
  },

  onLoad() {
    const app = getApp();
    this.setData({
      subjects: app.globalData.subjects,
      featuredChapters: getFeaturedChapters(),
      totalChapters: getAllChapters().length,
    });
  },

  onShow() {
    const app = getApp();
    app.refreshSession();
    this.setData({
      favoritesCount: app.globalData.favorites.length,
      recentsCount: app.globalData.recents.length,
    });
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

    wx.showToast({
      title: '该学科后续开放',
      icon: 'none',
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
