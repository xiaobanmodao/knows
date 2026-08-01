const BACKUP_FORMAT = 'knows-local-backup';
const BACKUP_VERSION = 1;
const CURRENT_CONTENT_SCHEMA_VERSION = 4;
const MAX_BACKUP_TEXT_LENGTH = 2 * 1024 * 1024;
const SUBJECT_IDS = new Set(['math', 'english', 'physics']);
const CONTENT_TYPES = new Set(['subject', 'chapter', 'unit', 'topic', 'knowledge', 'template', 'word', 'grammar']);
const MATH_GRADES = new Set(['grade7', 'grade8', 'grade9']);
const {
  DEFAULT_READING_PREFERENCES,
  normalizeReadingPreferences,
} = require('./reading-preferences');

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value, maxLength, fallback = '') {
  const result = String(value || '').trim().slice(0, maxLength);
  return result || fallback;
}

function cleanNumber(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? Math.round(result) : fallback;
}

function normalizeSubjectId(value) {
  return SUBJECT_IDS.has(value) ? value : 'math';
}

function normalizeType(value) {
  return CONTENT_TYPES.has(value) ? value : 'knowledge';
}

function itemKey(item) {
  return `${item.subjectId || 'math'}:${item.type || 'knowledge'}:${item.id}`;
}

function normalizeContentItem(item, timestampField) {
  if (!isRecord(item)) return null;
  const id = cleanString(item.id, 160);
  if (!id) return null;

  const result = {
    id,
    subjectId: normalizeSubjectId(item.subjectId),
    type: normalizeType(item.type),
    title: cleanString(item.title, 120, '未命名内容'),
    subtitle: cleanString(item.subtitle, 200),
    containerId: cleanString(item.containerId || item.chapterId, 160),
  };
  const focusId = cleanString(item.focusId, 160);
  const focusType = cleanString(item.focusType, 24);
  if (focusId) result.focusId = focusId;
  if (focusType) result.focusType = focusType;
  result[timestampField] = cleanNumber(item[timestampField]);
  return result;
}

function normalizeReadingItem(item) {
  const base = normalizeContentItem(item, 'updatedAt');
  if (!base) return null;
  base.type = 'knowledge';
  base.scrollTop = Math.min(cleanNumber(item.scrollTop), 10000000);
  const viewState = isRecord(item.viewState) ? item.viewState : {};
  base.viewState = {
    detailsExpanded: Boolean(viewState.detailsExpanded),
    templateExpanded: Boolean(viewState.templateExpanded),
    expandedProblems: [...new Set((Array.isArray(viewState.expandedProblems) ? viewState.expandedProblems : [])
      .map((id) => cleanString(id, 160))
      .filter(Boolean))].slice(0, 20),
  };
  return base;
}

function normalizeNote(item) {
  const base = normalizeContentItem(item, 'updatedAt');
  if (!base) return null;
  return {
    ...base,
    type: 'knowledge',
    content: cleanString(item.content, 800),
    tags: [...new Set((Array.isArray(item.tags) ? item.tags : [])
      .map((tag) => cleanString(tag, 12))
      .filter(Boolean))].slice(0, 5),
  };
}

function normalizeArray(items, normalizer, limit) {
  const seen = new Set();
  const result = [];
  (Array.isArray(items) ? items : []).forEach((item) => {
    const normalized = normalizer(item);
    if (!normalized) return;
    const key = itemKey(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });
  return result.slice(0, limit);
}

function normalizeReadingPositions(positions) {
  const entries = Object.values(isRecord(positions) ? positions : {})
    .map(normalizeReadingItem)
    .filter(Boolean)
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 100);
  return entries.reduce((result, item) => {
    result[itemKey(item)] = item;
    return result;
  }, {});
}

function normalizeSearchHistory(history) {
  return [...new Set((Array.isArray(history) ? history : [])
    .map((keyword) => cleanString(keyword, 80))
    .filter(Boolean))].slice(0, 12);
}

function normalizeSnapshot(snapshot = {}) {
  const source = isRecord(snapshot) ? snapshot : {};
  const schemaVersion = cleanNumber(source.contentSchemaVersion, CURRENT_CONTENT_SCHEMA_VERSION);
  const hasReadingPreferences = Object.prototype.hasOwnProperty.call(source, 'readingPreferences')
    && source.readingPreferences !== null;
  return {
    contentSchemaVersion: Math.min(schemaVersion, CURRENT_CONTENT_SCHEMA_VERSION),
    favorites: normalizeArray(source.favorites, (item) => normalizeContentItem(item, 'savedAt'), 100),
    recents: normalizeArray(source.recents, (item) => normalizeContentItem(item, 'viewedAt'), 30),
    searchHistory: normalizeSearchHistory(source.searchHistory),
    readingPositions: normalizeReadingPositions(source.readingPositions),
    lastReading: normalizeReadingItem(source.lastReading),
    notes: normalizeArray(source.notes, normalizeNote, 200),
    mathGrade: MATH_GRADES.has(source.mathGrade) ? source.mathGrade : 'grade8',
    readingPreferences: hasReadingPreferences
      ? normalizeReadingPreferences(source.readingPreferences)
      : null,
  };
}

function getSnapshotCounts(snapshot) {
  const data = normalizeSnapshot(snapshot);
  return {
    favorites: data.favorites.length,
    recents: data.recents.length,
    searchHistory: data.searchHistory.length,
    readingPositions: Object.keys(data.readingPositions).length,
    notes: data.notes.length,
  };
}

function checksumText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const value = (hash >>> 0).toString(16);
  return `${'00000000'.slice(value.length)}${value}`;
}

function utf8ByteLength(text) {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff
      && text.charCodeAt(index + 1) >= 0xdc00 && text.charCodeAt(index + 1) <= 0xdfff) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

function checksumPayload(backup) {
  return JSON.stringify({
    format: backup.format,
    backupVersion: backup.backupVersion,
    contentSchemaVersion: backup.contentSchemaVersion,
    createdAt: backup.createdAt,
    appVersion: backup.appVersion,
    data: backup.data,
  });
}

function createBackup(snapshot, metadata = {}) {
  const data = normalizeSnapshot(snapshot);
  data.readingPreferences = data.readingPreferences
    || normalizeReadingPreferences(DEFAULT_READING_PREFERENCES);
  const createdDate = new Date(metadata.createdAt || Date.now());
  if (Number.isNaN(createdDate.getTime())) {
    throw new Error('备份时间无效');
  }
  const createdAt = createdDate.toISOString();
  const backup = {
    format: BACKUP_FORMAT,
    backupVersion: BACKUP_VERSION,
    contentSchemaVersion: data.contentSchemaVersion,
    createdAt,
    appVersion: cleanString(metadata.appVersion, 40, 'unknown'),
    counts: getSnapshotCounts(data),
    data,
  };
  backup.checksum = checksumText(checksumPayload(backup));
  return backup;
}

function serializeBackup(backup) {
  return JSON.stringify(backup, null, 2);
}

function parseBackupText(text) {
  const source = String(text || '');
  if (!source.trim()) throw new Error('备份文件为空');
  if (utf8ByteLength(source) > MAX_BACKUP_TEXT_LENGTH) throw new Error('备份文件超过 2MB 限制');

  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error('备份文件不是有效的 JSON');
  }
  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT) throw new Error('这不是知识通备份文件');
  if (parsed.backupVersion !== BACKUP_VERSION) throw new Error('备份格式版本暂不支持');
  if (cleanNumber(parsed.contentSchemaVersion) > CURRENT_CONTENT_SCHEMA_VERSION) {
    throw new Error('备份来自更新版本，请先升级知识通');
  }
  if (Number.isNaN(Date.parse(parsed.createdAt))) throw new Error('备份时间无效');
  if (!isRecord(parsed.data)) throw new Error('备份数据不完整');
  if (parsed.checksum !== checksumText(checksumPayload(parsed))) throw new Error('备份校验失败，文件可能已损坏');

  const data = normalizeSnapshot({
    ...parsed.data,
    contentSchemaVersion: parsed.contentSchemaVersion,
  });
  return {
    format: BACKUP_FORMAT,
    backupVersion: BACKUP_VERSION,
    contentSchemaVersion: data.contentSchemaVersion,
    createdAt: parsed.createdAt,
    appVersion: cleanString(parsed.appVersion, 40, 'unknown'),
    counts: getSnapshotCounts(data),
    checksum: parsed.checksum,
    data,
  };
}

function mergeTimedItems(currentItems, incomingItems, timestampField, limit, normalizer) {
  const combined = [...incomingItems, ...currentItems]
    .map((item, order) => ({ item: normalizer(item), order }))
    .filter((entry) => entry.item)
    .sort((left, right) => (
      right.item[timestampField] - left.item[timestampField] || left.order - right.order
    ));
  const seen = new Set();
  return combined.reduce((result, entry) => {
    const key = itemKey(entry.item);
    if (!seen.has(key) && result.length < limit) {
      seen.add(key);
      result.push(entry.item);
    }
    return result;
  }, []);
}

function mergeSnapshots(currentSnapshot, incomingSnapshot) {
  const current = normalizeSnapshot(currentSnapshot);
  const incoming = normalizeSnapshot(incomingSnapshot);
  const readingItems = mergeTimedItems(
    Object.values(current.readingPositions),
    Object.values(incoming.readingPositions),
    'updatedAt',
    100,
    normalizeReadingItem,
  );
  const readingPositions = readingItems.reduce((result, item) => {
    result[itemKey(item)] = item;
    return result;
  }, {});
  const lastReadingCandidates = [incoming.lastReading, current.lastReading]
    .filter(Boolean)
    .sort((left, right) => right.updatedAt - left.updatedAt);

  return normalizeSnapshot({
    contentSchemaVersion: Math.min(current.contentSchemaVersion, incoming.contentSchemaVersion),
    favorites: mergeTimedItems(current.favorites, incoming.favorites, 'savedAt', 100, (item) => normalizeContentItem(item, 'savedAt')),
    recents: mergeTimedItems(current.recents, incoming.recents, 'viewedAt', 30, (item) => normalizeContentItem(item, 'viewedAt')),
    searchHistory: [...incoming.searchHistory, ...current.searchHistory],
    readingPositions,
    lastReading: lastReadingCandidates[0] || null,
    notes: mergeTimedItems(current.notes, incoming.notes, 'updatedAt', 200, normalizeNote),
    mathGrade: incoming.mathGrade,
    readingPreferences: incoming.readingPreferences
      || current.readingPreferences
      || DEFAULT_READING_PREFERENCES,
  });
}

module.exports = {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  CURRENT_CONTENT_SCHEMA_VERSION,
  MAX_BACKUP_TEXT_LENGTH,
  createBackup,
  getSnapshotCounts,
  mergeSnapshots,
  normalizeSnapshot,
  parseBackupText,
  serializeBackup,
};
