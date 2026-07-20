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

const TYPE_LABELS = RESULT_GROUPS.reduce((map, item) => ({ ...map, [item.type]: item.title }), {});

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
  const groupMap = new Map();

  results.forEach((item) => {
    const key = `${item.subjectId}-${item.type}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        type: item.type,
        title: `${SUBJECT_LABELS[item.subjectId]} · ${TYPE_LABELS[item.type]}`,
        items: [],
        count: 0,
      });
    }

    const group = groupMap.get(key);
    group.items.push(item);
    group.count += 1;
  });

  return [...groupMap.values()];
}

function buildTypeFilters(results) {
  const counts = results.reduce((map, item) => ({
    ...map,
    [item.type]: (map[item.type] || 0) + 1,
  }), {});

  return [
    { id: 'all', title: '全部类型', count: results.length },
    ...RESULT_GROUPS
      .filter((item) => counts[item.type])
      .map((item) => ({ id: item.type, title: TYPE_LABELS[item.type], count: counts[item.type] })),
  ];
}

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
    query: '',
    results: [],
    groupedResults: [],
    hasSearched: false,
    searchHistory: [],
    recommendedKeywords: RECOMMENDED_KEYWORDS,
    subjectFilters: SUBJECT_FILTERS,
    selectedSubjectId: 'all',
    typeFilters: [],
    selectedType: 'all',
  },

  onLoad(options) {
    const app = getApp();
    app.refreshSession();
    const initialQuery = decodeQueryValue(options.q);
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

    if (!keyword) {
      this.setData({
        query: '',
        results: [],
        groupedResults: [],
        hasSearched: false,
        typeFilters: [],
        selectedType: 'all',
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
    const selectedType = this.data.selectedType !== 'all' && results.some((item) => item.type === this.data.selectedType)
      ? this.data.selectedType
      : 'all';
    const visibleResults = selectedType === 'all'
      ? results
      : results.filter((item) => item.type === selectedType);
    if (saveHistory) {
      const app = getApp();
      app.addSearchKeyword(keyword);
    }

    this.setData({
      query: keyword,
      results,
      groupedResults: groupSearchResults(visibleResults),
      typeFilters: buildTypeFilters(results),
      selectedType,
      hasSearched: true,
    });
  },

  selectSubject(event) {
    const selectedSubjectId = event.currentTarget.dataset.id;
    this.setData({ selectedSubjectId, selectedType: 'all' });

    if (this.data.query) {
      this.executeSearch(this.data.query, { silentEmpty: true, saveHistory: false });
    }
  },

  selectType(event) {
    const selectedType = event.currentTarget.dataset.id;
    const visibleResults = selectedType === 'all'
      ? this.data.results
      : this.data.results.filter((item) => item.type === selectedType);

    this.setData({
      selectedType,
      groupedResults: groupSearchResults(visibleResults),
    });
  },

  selectKeyword(event) {
    const { keyword } = event.currentTarget.dataset;
    this.executeSearch(keyword, { silentEmpty: false, saveHistory: true });
  },

  openResult(event) {
    const { type, id, subjectId, focusId } = event.currentTarget.dataset;
    const url = ['unit', 'word', 'grammar'].includes(type)
      ? `/pages/english-unit/index?id=${id}${focusId ? `&focusType=${type}&focusId=${focusId}` : ''}`
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

  onUnload() {
    clearTimeout(this.searchTimer);
  },
});
