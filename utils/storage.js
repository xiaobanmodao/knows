const FAVORITES_KEY = 'knows_favorites';
const RECENTS_KEY = 'knows_recents';
const SEARCH_HISTORY_KEY = 'knows_search_history';
const CONTENT_SCHEMA_VERSION_KEY = 'knows_content_schema_version';
const MATH_GRADE_KEY = 'knows_math_grade';
const CURRENT_CONTENT_SCHEMA_VERSION = 2;
const MATH_GRADES = new Set(['grade7', 'grade8', 'grade9']);

function read(key, fallback) {
  try {
    return wx.getStorageSync(key) || fallback;
  } catch (error) {
    return fallback;
  }
}

function write(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    // Ignore storage write errors to keep browsing flow usable in guest mode.
  }
}

function getFavorites() {
  return read(FAVORITES_KEY, []);
}

function toggleFavorite(item) {
  const favorites = getFavorites();
  const exists = favorites.some((entry) => entry.id === item.id);
  const nextFavorites = exists
    ? favorites.filter((entry) => entry.id !== item.id)
    : [{ ...item, savedAt: Date.now() }, ...favorites].slice(0, 100);

  write(FAVORITES_KEY, nextFavorites);
  return nextFavorites;
}

function getRecents() {
  return read(RECENTS_KEY, []);
}

function addRecent(item) {
  const recents = getRecents().filter((entry) => entry.id !== item.id);
  const nextRecents = [{ ...item, viewedAt: Date.now() }, ...recents].slice(0, 30);
  write(RECENTS_KEY, nextRecents);
  return nextRecents;
}

function getSearchHistory() {
  return read(SEARCH_HISTORY_KEY, []);
}

function addSearchKeyword(keyword) {
  if (!keyword) {
    return getSearchHistory();
  }

  const normalizedKeyword = keyword.trim();
  const history = getSearchHistory().filter((entry) => entry !== normalizedKeyword);
  const nextHistory = [normalizedKeyword, ...history].slice(0, 12);
  write(SEARCH_HISTORY_KEY, nextHistory);
  return nextHistory;
}

function migrateStoredItems(key, resolveId, limit) {
  const items = read(key, []);

  if (!Array.isArray(items)) {
    write(key, []);
    return [];
  }

  const migrated = [];
  const seenIds = new Set();

  items.forEach((item) => {
    if (!item || !item.id) {
      return;
    }

    const id = resolveId(item.id) || item.id;

    if (seenIds.has(id)) {
      return;
    }

    seenIds.add(id);
    migrated.push({ ...item, id });
  });

  const result = migrated.slice(0, limit);
  write(key, result);
  return result;
}

function migrateContentStorage(resolveId) {
  const currentVersion = Number(read(CONTENT_SCHEMA_VERSION_KEY, 0));

  if (currentVersion >= CURRENT_CONTENT_SCHEMA_VERSION || typeof resolveId !== 'function') {
    return false;
  }

  migrateStoredItems(FAVORITES_KEY, resolveId, 100);
  migrateStoredItems(RECENTS_KEY, resolveId, 30);
  write(CONTENT_SCHEMA_VERSION_KEY, CURRENT_CONTENT_SCHEMA_VERSION);
  return true;
}

function getMathGrade() {
  const gradeId = read(MATH_GRADE_KEY, 'grade8');
  return MATH_GRADES.has(gradeId) ? gradeId : 'grade8';
}

function setMathGrade(gradeId) {
  const nextGradeId = MATH_GRADES.has(gradeId) ? gradeId : 'grade8';
  write(MATH_GRADE_KEY, nextGradeId);
  return nextGradeId;
}

module.exports = {
  getFavorites,
  toggleFavorite,
  getRecents,
  addRecent,
  getSearchHistory,
  addSearchKeyword,
  migrateContentStorage,
  getMathGrade,
  setMathGrade,
};
