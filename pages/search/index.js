const { searchAllSubjects, SUBJECT_LABELS } = require('../../utils/subjects');

const RESULT_GROUPS = [
  { type: 'unit', title: '教材单元' },
  { type: 'word', title: '单词' },
  { type: 'grammar', title: '单元语法' },
  { type: 'chapter', title: '章节' },
  { type: 'topic', title: '专题' },
  { type: 'knowledge', title: '知识点' },
  { type: 'template', title: '方法模板' },
];

const SUBJECT_FILTERS = [
  { id: 'all', title: '全部' },
  { id: 'math', title: '数学' },
  { id: 'english', title: '英语' },
  { id: 'physics', title: '物理' },
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
  '被动语态',
  '现在完成时',
  'stomachache',
  'used to',
  '阅读主旨',
  '受力分析',
  '欧姆定律',
];

function groupSearchResults(results) {
  return ['math', 'english', 'physics'].flatMap((subjectId) => RESULT_GROUPS.map((group) => {
    const items = results.filter((item) => item.subjectId === subjectId && item.type === group.type);
    return {
      ...group,
      key: `${subjectId}-${group.type}`,
      title: `${SUBJECT_LABELS[subjectId]} · ${group.title}`,
      items,
      count: items.length,
    };
  }))
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
    subjectFilters: SUBJECT_FILTERS,
    selectedSubjectId: 'all',
  },

  onLoad(options) {
    const app = getApp();
    app.refreshSession();
    const initialQuery = options.q || '';
    const selectedSubjectId = SUBJECT_FILTERS.some((item) => item.id === options.subjectId) ? options.subjectId : 'all';

    this.setData({
      query: initialQuery,
      searchHistory: app.globalData.searchHistory || [],
      selectedSubjectId,
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

    const results = searchAllSubjects(keyword, this.data.selectedSubjectId);
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

  selectSubject(event) {
    const selectedSubjectId = event.currentTarget.dataset.id;
    this.setData({ selectedSubjectId });

    if (this.data.query) {
      this.executeSearch(this.data.query, { silentEmpty: true, saveHistory: false });
    }
  },

  selectKeyword(event) {
    const { keyword } = event.currentTarget.dataset;
    this.executeSearch(keyword, { silentEmpty: false, saveHistory: true });
  },

  openResult(event) {
    const { type, id, subjectId } = event.currentTarget.dataset;
    const url = ['unit', 'word', 'grammar'].includes(type)
      ? `/pages/english-unit/index?id=${id}`
      : type === 'chapter'
        ? (subjectId === 'physics'
          ? `/pages/physics-chapter/index?id=${id}`
          : `/pages/chapter/index?id=${id}`)
      : type === 'topic'
        ? `/pages/topic/index?subjectId=${subjectId}&id=${id}`
      : type === 'template'
        ? `/pages/template/index?subjectId=${subjectId}&id=${id}`
        : `/pages/knowledge/index?subjectId=${subjectId}&id=${id}`;

    wx.navigateTo({ url });
  },
});
