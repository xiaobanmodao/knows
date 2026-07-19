const storage = require('./utils/storage');
const { CLOUD_ENV_ID } = require('./utils/asset-config');
const { resolveKnowledgeId } = require('./utils/content-ids');
const { getSubjectRegistry } = require('./utils/subjects');

App({
  globalData: {
    userMode: 'guest',
    subjects: getSubjectRegistry(),
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
    return nextFavorites.some((entry) => (
      entry.id === item.id
      && (entry.subjectId || 'math') === (item.subjectId || 'math')
      && (entry.type || 'knowledge') === (item.type || 'knowledge')
    ));
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
