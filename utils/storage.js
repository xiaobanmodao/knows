const FAVORITES_KEY = 'knows_favorites';
const RECENTS_KEY = 'knows_recents';
const SEARCH_HISTORY_KEY = 'knows_search_history';

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

module.exports = {
  getFavorites,
  toggleFavorite,
  getRecents,
  addRecent,
  getSearchHistory,
  addSearchKeyword,
};
