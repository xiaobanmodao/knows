const { getChapterGroups } = require('../../utils/math');

Page({
  data: {
    chapterGroups: [],
    totalChapters: 0,
  },

  onLoad() {
    const chapterGroups = getChapterGroups();
    this.setData({
      chapterGroups,
      totalChapters: chapterGroups.reduce((sum, group) => sum + group.items.length, 0),
    });
  },

  openSearch() {
    wx.navigateTo({
      url: '/pages/search/index',
    });
  },

  openChapter(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/chapter/index?id=${id}`,
    });
  },
});
