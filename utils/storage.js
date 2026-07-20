const FAVORITES_KEY = 'knows_favorites';
const RECENTS_KEY = 'knows_recents';
const SEARCH_HISTORY_KEY = 'knows_search_history';
const READING_POSITIONS_KEY = 'knows_reading_positions';
const LAST_READING_KEY = 'knows_last_reading';
const NOTES_KEY = 'knows_knowledge_notes';
const CONTENT_SCHEMA_VERSION_KEY = 'knows_content_schema_version';
const MATH_GRADE_KEY = 'knows_math_grade';
const CURRENT_CONTENT_SCHEMA_VERSION = 4;
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

function getReadingPositions() {
  const positions = read(READING_POSITIONS_KEY, {});
  return positions && typeof positions === 'object' && !Array.isArray(positions) ? positions : {};
}

function getReadingPosition(subjectId, knowledgeId) {
  return getReadingPositions()[`${subjectId || 'math'}:knowledge:${knowledgeId}`] || null;
}

function saveReadingPosition(item, scrollTop = 0, viewState = {}) {
  if (!item || !item.id) {
    return null;
  }

  const entry = {
    ...item,
    subjectId: item.subjectId || 'math',
    type: 'knowledge',
    scrollTop: Math.max(0, Math.round(Number(scrollTop) || 0)),
    viewState: {
      detailsExpanded: Boolean(viewState.detailsExpanded),
      templateExpanded: Boolean(viewState.templateExpanded),
      expandedProblems: Array.isArray(viewState.expandedProblems) ? viewState.expandedProblems.slice(0, 20) : [],
    },
    updatedAt: Date.now(),
  };
  const positions = getReadingPositions();
  positions[itemKey(entry)] = entry;
  const limitedPositions = Object.fromEntries(
    Object.entries(positions)
      .sort(([, left], [, right]) => (right.updatedAt || 0) - (left.updatedAt || 0))
      .slice(0, 100),
  );

  write(READING_POSITIONS_KEY, limitedPositions);
  write(LAST_READING_KEY, entry);
  return entry;
}

function getLastReading() {
  const item = read(LAST_READING_KEY, null);
  return item && item.id ? item : null;
}

function getNotes() {
  const notes = read(NOTES_KEY, []);
  return Array.isArray(notes) ? notes : [];
}

function getKnowledgeNote(subjectId, knowledgeId) {
  const key = `${subjectId || 'math'}:knowledge:${knowledgeId}`;
  return getNotes().find((item) => itemKey(item) === key) || null;
}

function saveKnowledgeNote(item) {
  if (!item || !item.id) {
    return null;
  }

  const subjectId = item.subjectId || 'math';
  const content = String(item.content || '').trim().slice(0, 800);
  const tags = [...new Set((item.tags || [])
    .map((tag) => String(tag || '').trim().slice(0, 12))
    .filter(Boolean))].slice(0, 5);
  const key = `${subjectId}:knowledge:${item.id}`;
  const remaining = getNotes().filter((entry) => itemKey(entry) !== key);

  if (!content && !tags.length) {
    write(NOTES_KEY, remaining);
    return null;
  }

  const note = {
    ...item,
    subjectId,
    type: 'knowledge',
    content,
    tags,
    updatedAt: Date.now(),
  };
  write(NOTES_KEY, [note, ...remaining].slice(0, 200));
  return note;
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
  migrateStoredItems(NOTES_KEY, resolveId, 200);
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
  getReadingPosition,
  saveReadingPosition,
  getLastReading,
  getNotes,
  getKnowledgeNote,
  saveKnowledgeNote,
  migrateContentStorage,
  getMathGrade,
  setMathGrade,
};
