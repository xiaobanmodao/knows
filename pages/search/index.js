const { searchMath } = require('../../utils/math');

Page({
  data: {
    query: '',
    results: [],
  },

  onLoad(options) {
    const app = getApp();
    app.refreshSession();
    const initialQuery = options.q || '';

    this.setData({
      query: initialQuery,
    });

    if (initialQuery) {
      this.executeSearch(initialQuery);
    }
  },

  onChange(event) {
    const query = event.detail.value || '';
    this.setData({ query });
    this.executeSearch(query, { silentEmpty: true, saveHistory: false });
  },

  onSubmit(event) {
    this.executeSearch(event.detail.value || this.data.query, { silentEmpty: false, saveHistory: true });
  },

  executeSearch(rawKeyword, options = {}) {
    const { silentEmpty = false, saveHistory = false } = options;
    const keyword = (rawKeyword || '').trim();

    if (!keyword) {
      this.setData({
        query: '',
        results: [],
      });
      if (!silentEmpty) {
        wx.showToast({
          title: '请输入搜索关键词',
          icon: 'none',
        });
      }
      return;
    }

    const results = searchMath(keyword);
    if (saveHistory) {
      const app = getApp();
      app.addSearchKeyword(keyword);
    }

    this.setData({
      query: keyword,
      results,
    });
  },

  openResult(event) {
    const { type, id } = event.currentTarget.dataset;
    const url = type === 'chapter'
      ? `/pages/chapter/index?id=${id}`
      : type === 'template'
        ? `/pages/template/index?id=${id}`
        : `/pages/knowledge/index?id=${id}`;

    wx.navigateTo({ url });
  },
});
