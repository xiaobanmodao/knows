const storage = require('./utils/storage');
const { CLOUD_ENV_ID } = require('./utils/asset-config');
const { resolveKnowledgeId } = require('./utils/content-ids');

App({
  globalData: {
    userMode: 'guest',
    subjects: [
      {
        id: 'math',
        name: '初中数学',
        subtitle: '已开放',
        description: '按人教版知识体系整理，覆盖基础、提升与压轴题型。',
        status: 'active',
        theme: 'math',
      },
      {
        id: 'english',
        name: '初中英语',
        subtitle: '即将开放',
        description: '语法、写作模板、阅读题型与重点短语。',
        status: 'coming',
        theme: 'english',
      },
      {
        id: 'physics',
        name: '初中物理',
        subtitle: '即将开放',
        description: '概念、公式、实验题与计算题模板。',
        status: 'coming',
        theme: 'physics',
      },
    ],
  },

  onLaunch() {
    if (CLOUD_ENV_ID && wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true,
      });
    }

    storage.migrateContentStorage(resolveKnowledgeId);
    this.refreshSession();
  },

  refreshSession() {
    this.globalData.favorites = storage.getFavorites();
    this.globalData.recents = storage.getRecents();
    this.globalData.searchHistory = storage.getSearchHistory();
  },

  toggleFavorite(item) {
    const nextFavorites = storage.toggleFavorite(item);
    this.globalData.favorites = nextFavorites;
    return nextFavorites.some((entry) => entry.id === item.id);
  },

  addRecent(item) {
    const nextRecents = storage.addRecent(item);
    this.globalData.recents = nextRecents;
    return nextRecents;
  },

  addSearchKeyword(keyword) {
    const nextHistory = storage.addSearchKeyword(keyword);
    this.globalData.searchHistory = nextHistory;
    return nextHistory;
  },

  getMathGrade() {
    return storage.getMathGrade();
  },

  setMathGrade(gradeId) {
    return storage.setMathGrade(gradeId);
  },
});
