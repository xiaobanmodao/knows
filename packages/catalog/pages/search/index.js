const { getSubjectRegistry } = require('../../../../data/subject-manifest');
const { searchAllSubjects } = require('../../utils/search-index');
const { buildSearchDisplay } = require('../../utils/search-display');
const { openContent } = require('../../../../utils/content-routes');

const SUBJECT_FILTERS = [
  { id: 'all', title: '全部' },
  ...getSubjectRegistry().map((subject) => ({ id: subject.id, title: subject.shortName })),
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

function decodeQueryValue(value) {
  const text = String(value || '');

  try {
    return decodeURIComponent(text);
  } catch (error) {
    return text;
  }
}

Page({
  data: {
    loading: true,
    notFound: '',
    query: '',
    groupedResults: [],
    totalResultCount: 0,
    displayedResultCount: 0,
    hasSearched: false,
    searchHistory: [],
    recommendedKeywords: RECOMMENDED_KEYWORDS,
    subjectFilters: SUBJECT_FILTERS,
    selectedSubjectId: 'all',
    typeFilters: [],
    selectedType: 'all',
  },

  onLoad(options = {}) {
    this.pageActive = true;
    this.allResults = [];
    this.setData({ loading: true, notFound: '' });

    try {
      const app = getApp();
      app.refreshSession();
      const initialQuery = decodeQueryValue(options.q);
      const selectedSubjectId = SUBJECT_FILTERS.some((item) => item.id === options.subjectId) ? options.subjectId : 'all';
      this.initialSearchQuery = initialQuery;
      this.initialSubjectId = selectedSubjectId;

      this.setData({
        query: initialQuery,
        searchHistory: app.globalData.searchHistory || [],
        selectedSubjectId,
      });

      if (initialQuery) {
        this.executeSearch(initialQuery);
      } else {
        this.setData({ loading: false, notFound: '' });
      }
    } catch (error) {
      this.showFailure();
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
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.executeSearch(query, { silentEmpty: true, saveHistory: false });
    }, 180);
  },

  onSubmit(event) {
    this.executeSearch(event.detail.value || this.data.query, { silentEmpty: false, saveHistory: true });
  },

  executeSearch(rawKeyword, options = {}) {
    const { silentEmpty = false, saveHistory = false } = options;
    const keyword = (rawKeyword || '').trim();
    this.lastSearchKeyword = keyword;

    if (!keyword) {
      this.allResults = [];
      this.setData({
        query: '',
        groupedResults: [],
        totalResultCount: 0,
        displayedResultCount: 0,
        hasSearched: false,
        typeFilters: [],
        selectedType: 'all',
        loading: false,
        notFound: '',
      });
      if (!silentEmpty) {
        wx.showToast({
          title: '请输入搜索关键词',
          icon: 'none',
        });
      }
      return;
    }

    this.setData({ loading: true, notFound: '' });

    try {
      const results = searchAllSubjects(keyword, this.data.selectedSubjectId);
      const selectedType = this.data.selectedType !== 'all' && results.some((item) => item.type === this.data.selectedType)
        ? this.data.selectedType
        : 'all';
      const display = buildSearchDisplay(results, selectedType);
      if (saveHistory) {
        const app = getApp();
        app.addSearchKeyword(keyword);
      }

      this.allResults = results;
      this.setData({
        loading: false,
        notFound: '',
        query: keyword,
        groupedResults: display.groupedResults,
        typeFilters: display.typeFilters,
        totalResultCount: display.totalResultCount,
        displayedResultCount: display.displayedResultCount,
        selectedType,
        hasSearched: true,
      });
    } catch (error) {
      this.showFailure();
    }
  },

  showFailure() {
    this.allResults = [];
    this.setData({
      loading: false,
      notFound: '搜索暂未打开，请重试。',
      groupedResults: [],
      totalResultCount: 0,
      displayedResultCount: 0,
      hasSearched: false,
      typeFilters: [],
      selectedType: 'all',
    });
  },

  reopen() {
    this.onLoad({
      q: this.lastSearchKeyword || this.data.query || this.initialSearchQuery || '',
      subjectId: this.data.selectedSubjectId === 'all' ? '' : this.data.selectedSubjectId,
    });
  },

  selectSubject(event) {
    const selectedSubjectId = event.currentTarget.dataset.id;
    this.allResults = [];
    this.setData({ selectedSubjectId, selectedType: 'all' });

    if (this.data.query) {
      this.executeSearch(this.data.query, { silentEmpty: true, saveHistory: false });
    }
  },

  selectType(event) {
    const selectedType = event.currentTarget.dataset.id;
    const display = buildSearchDisplay(this.allResults || [], selectedType);

    this.setData({
      selectedType,
      groupedResults: display.groupedResults,
      totalResultCount: display.totalResultCount,
      displayedResultCount: display.displayedResultCount,
    });
  },

  selectKeyword(event) {
    const { keyword } = event.currentTarget.dataset;
    this.executeSearch(keyword, { silentEmpty: false, saveHistory: true });
  },

  openResult(event) {
    const { type, id, subjectId, focusId } = event.currentTarget.dataset;
    openContent({ type, id, subjectId, focusId });
  },

  onUnload() {
    this.pageActive = false;
    this.allResults = [];
    clearTimeout(this.searchTimer);
  },
});
