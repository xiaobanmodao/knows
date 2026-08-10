const storage = require('./utils/storage');
const { CLOUD_ENV_ID } = require('./utils/asset-config');
const { resolveKnowledgeId } = require('./utils/content-ids');
const { getSubjectRegistry } = require('./data/subject-manifest');
const { clearTempFileURLCache } = require('./utils/cloud-assets');
const { mergeSnapshots, normalizeSnapshot } = require('./utils/local-backup');

function hasRuntimeAppId() {
  if (typeof wx.getAccountInfoSync !== 'function') {
    return true;
  }

  try {
    const accountInfo = wx.getAccountInfoSync();
    return Boolean(accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.appId);
  } catch (error) {
    return false;
  }
}

function initCloudEnvironment() {
  if (!CLOUD_ENV_ID || !wx.cloud || !hasRuntimeAppId()) {
    return false;
  }

  try {
    wx.cloud.init({
      env: CLOUD_ENV_ID,
      traceUser: false,
    });
    return true;
  } catch (error) {
    return false;
  }
}

App({
  globalData: {
    userMode: 'guest',
    subjects: getSubjectRegistry(),
    cloudReady: false,
  },

  onLaunch() {
    clearTempFileURLCache();
    this.globalData.cloudReady = initCloudEnvironment();

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

  getReadingPosition(subjectId, knowledgeId) {
    return storage.getReadingPosition(subjectId, knowledgeId);
  },

  saveReadingPosition(item, scrollTop, viewState) {
    return storage.saveReadingPosition(item, scrollTop, viewState);
  },

  getLastReading() {
    return storage.getLastReading();
  },

  getNotes() {
    return storage.getNotes();
  },

  getKnowledgeNote(subjectId, knowledgeId) {
    return storage.getKnowledgeNote(subjectId, knowledgeId);
  },

  saveKnowledgeNote(item) {
    return storage.saveKnowledgeNote(item);
  },

  getMathGrade() {
    return storage.getMathGrade();
  },

  setMathGrade(gradeId) {
    return storage.setMathGrade(gradeId);
  },

  getReadingPreferences() {
    return storage.getReadingPreferences();
  },

  setReadingPreferences(value) {
    return storage.setReadingPreferences(value);
  },

  resetReadingPreferences() {
    return storage.resetReadingPreferences();
  },

  getLocalDataSnapshot() {
    return storage.getLocalDataSnapshot();
  },

  restoreLocalData(snapshot, mode = 'merge') {
    const current = storage.getLocalDataSnapshot();
    const next = mode === 'replace'
      ? normalizeSnapshot(snapshot)
      : mergeSnapshots(current, snapshot);
    storage.replaceLocalData(next);
    storage.migrateContentStorage(resolveKnowledgeId);
    this.refreshSession();
    return storage.getLocalDataSnapshot();
  },
});
