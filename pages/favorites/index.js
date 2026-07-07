Page({
  data: {
    favorites: [],
    recents: [],
  },

  onShow() {
    const app = getApp();
    app.refreshSession();
    this.setData({
      favorites: app.globalData.favorites,
      recents: app.globalData.recents,
    });
  },

  openKnowledge(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/knowledge/index?id=${id}`,
    });
  },
});
