const { searchMath } = require('../../utils/math');

const RESULT_GROUPS = [
  { type: 'chapter', title: '章节', emptyText: '没有匹配章节' },
  { type: 'knowledge', title: '知识点', emptyText: '没有匹配知识点' },
  { type: 'template', title: '题型模型', emptyText: '没有匹配模型' },
];

const RECOMMENDED_KEYWORDS = [
  '二次函数',
  '相似',
  '勾股定理',
  '圆周角',
  '手拉手模型',
  '最短路径',
  '方程组',
  '三角函数',
];

function groupSearchResults(results) {
  return RESULT_GROUPS
    .map((group) => {
      const items = results.filter((item) => item.type === group.type);
      return {
        ...group,
        items,
        count: items.length,
      };
    })
    .filter((group) => group.count);
}

Page({
  data: {
    query: '',
    results: [],
    groupedResults: [],
    hasSearched: false,
    searchHistory: [],
    recommendedKeywords: RECOMMENDED_KEYWORDS,
  },

  onLoad(options) {
    const app = getApp();
    app.refreshSession();
    const initialQuery = options.q || '';

    this.setData({
      query: initialQuery,
      searchHistory: app.globalData.searchHistory || [],
    });

    if (initialQuery) {
      this.executeSearch(initialQuery);
    }
  },

  onShow() {
    const app = getApp();
    app.refreshSession();
    this.setData({
      searchHistory: app.globalData.searchHistory || [],
    });
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
        groupedResults: [],
        hasSearched: false,
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
      groupedResults: groupSearchResults(results),
      hasSearched: true,
    });
  },

  selectKeyword(event) {
    const { keyword } = event.currentTarget.dataset;
    this.executeSearch(keyword, { silentEmpty: false, saveHistory: true });
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
