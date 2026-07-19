const FAVORITES_KEY = 'knows_favorites';
const RECENTS_KEY = 'knows_recents';
const SEARCH_HISTORY_KEY = 'knows_search_history';
const CONTENT_SCHEMA_VERSION_KEY = 'knows_content_schema_version';
const MATH_GRADE_KEY = 'knows_math_grade';
const CURRENT_CONTENT_SCHEMA_VERSION = 3;
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

function itemKey(item) {
  return `${item.subjectId || 'math'}:${item.type || 'knowledge'}:${item.id}`;
}

function toggleFavorite(item) {
  const favorites = getFavorites();
  const key = itemKey(item);
  const exists = favorites.some((entry) => itemKey(entry) === key);
  const nextFavorites = exists
    ? favorites.filter((entry) => itemKey(entry) !== key)
    : [{ ...item, savedAt: Date.now() }, ...favorites].slice(0, 100);

  write(FAVORITES_KEY, nextFavorites);
  return nextFavorites;
}

function getRecents() {
  return read(RECENTS_KEY, []);
}

function addRecent(item) {
  const key = itemKey(item);
  const recents = getRecents().filter((entry) => itemKey(entry) !== key);
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

    const subjectId = item.subjectId || 'math';
    const type = item.type || 'knowledge';
    const id = subjectId === 'math' && type === 'knowledge'
      ? resolveId(item.id) || item.id
      : item.id;
    const migratedItem = {
      ...item,
      id,
      subjectId,
      type,
      containerId: item.containerId || item.chapterId || '',
    };
    const key = itemKey(migratedItem);

    if (seenIds.has(key)) {
      return;
    }

    seenIds.add(key);
    migrated.push(migratedItem);
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
