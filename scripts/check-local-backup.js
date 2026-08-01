const memory = new Map([
  ['knows_favorites', [{ id: 'existing', subjectId: 'math', type: 'knowledge', title: '现有收藏', savedAt: 10 }]],
  ['knows_recents', []],
  ['knows_search_history', ['现有搜索']],
  ['knows_reading_positions', {}],
  ['knows_last_reading', null],
  ['knows_knowledge_notes', []],
  ['knows_math_grade', 'grade8'],
  ['knows_content_schema_version', 4],
]);

let failKey = '';
global.wx = {
  getStorageSync(key) {
    return memory.get(key);
  },
  setStorageSync(key, value) {
    if (key === failKey) {
      failKey = '';
      throw new Error('mock storage full');
    }
    memory.set(key, value);
  },
};

const backup = require('../utils/local-backup');
const backupFile = require('../utils/local-backup-file');
const storage = require('../utils/storage');

function expectError(fn, messagePart) {
  try {
    fn();
    throw new Error(`应抛出错误：${messagePart}`);
  } catch (error) {
    if (!error.message.includes(messagePart)) throw error;
  }
}

const source = {
  contentSchemaVersion: 4,
  favorites: [
    { id: 'math-1', subjectId: 'math', type: 'knowledge', title: '勾股定理', savedAt: 100 },
    { id: 'math-1', subjectId: 'math', type: 'knowledge', title: '重复收藏', savedAt: 90 },
    null,
  ],
  recents: [{ id: 'phy-1', subjectId: 'physics', type: 'knowledge', title: '速度', viewedAt: 200 }],
  searchHistory: ['浮力', '浮力', '  主谓一致  '],
  readingPositions: {
    oldKey: {
      id: 'eng-1', subjectId: 'english', title: 'There be', scrollTop: 456.4,
      viewState: { detailsExpanded: true, expandedProblems: ['p1', 'p1'] }, updatedAt: 300,
    },
  },
  lastReading: { id: 'eng-1', subjectId: 'english', title: 'There be', scrollTop: 456, updatedAt: 300 },
  notes: [{
    id: 'phy-1', subjectId: 'physics', title: '速度', content: 'v=s/t',
    tags: ['公式', '公式', '运动'], updatedAt: 400,
  }],
  mathGrade: 'grade7',
};

const created = backup.createBackup(source, {
  appVersion: '1.6.0-dev.1',
  createdAt: '2026-08-01T08:00:00.000Z',
});
const text = backup.serializeBackup(created);
const parsed = backup.parseBackupText(text);

expectError(() => backup.parseBackupText(''), '文件为空');
expectError(() => backup.parseBackupText('{broken'), '有效的 JSON');
expectError(() => backup.parseBackupText('x'.repeat(backup.MAX_BACKUP_TEXT_LENGTH + 1)), '超过 2MB');
expectError(() => backup.parseBackupText('中'.repeat(Math.ceil(backup.MAX_BACKUP_TEXT_LENGTH / 3) + 1)), '超过 2MB');
if (backupFile.buildBackupFileName(Date.parse('2026-08-01T08:05:00.000Z')) !== 'knows-backup-20260801-1605.json') {
  throw new Error('备份文件名应使用本地日期和分钟');
}
if (!backupFile.isUserCancel({ errMsg: 'chooseMessageFile:fail cancel' })) throw new Error('用户取消选择应静默处理');

if (parsed.counts.favorites !== 1 || parsed.counts.notes !== 1 || parsed.counts.readingPositions !== 1) {
  throw new Error('备份数量统计错误');
}
if (parsed.data.searchHistory.join(',') !== '浮力,主谓一致') throw new Error('搜索历史应清理并去重');
if (parsed.data.notes[0].tags.length !== 2) throw new Error('笔记标签应清理并去重');
if (parsed.data.readingPositions['english:knowledge:eng-1'].scrollTop !== 456) {
  throw new Error('阅读位置应使用稳定键并规范数值');
}
if (source.favorites.length !== 3 || source.notes[0].tags.length !== 3) {
  throw new Error('备份生成不应修改源数据');
}

const tampered = JSON.parse(text);
tampered.data.notes[0].content = 'changed';
try {
  backup.parseBackupText(JSON.stringify(tampered));
  throw new Error('被篡改备份应校验失败');
} catch (error) {
  if (!error.message.includes('校验失败')) throw error;
}

const future = JSON.parse(text);
future.contentSchemaVersion = 99;
try {
  backup.parseBackupText(JSON.stringify(future));
  throw new Error('未来内容版本应被拒绝');
} catch (error) {
  if (!error.message.includes('更新版本')) throw error;
}

const current = {
  ...source,
  favorites: [
    { id: 'math-1', subjectId: 'math', type: 'knowledge', title: '当前较新收藏', savedAt: 500 },
    { id: 'math-2', subjectId: 'math', type: 'knowledge', title: '当前收藏', savedAt: 50 },
  ],
  notes: [{ id: 'phy-1', subjectId: 'physics', title: '速度', content: '当前较旧笔记', updatedAt: 100 }],
  searchHistory: ['欧姆定律'],
  mathGrade: 'grade9',
};
const merged = backup.mergeSnapshots(current, parsed.data);
if (merged.favorites.length !== 2 || merged.favorites[0].title !== '当前较新收藏') {
  throw new Error('合并时应按稳定 ID 去重并保留较新收藏');
}
if (merged.notes[0].content !== 'v=s/t') throw new Error('合并时应保留较新的备份笔记');
if (merged.searchHistory.join(',') !== '浮力,主谓一致,欧姆定律') throw new Error('搜索历史合并顺序错误');
if (merged.mathGrade !== 'grade7') throw new Error('恢复时应采用备份中的年级偏好');

storage.replaceLocalData(merged);
if (storage.getFavorites().length !== 2 || storage.getMathGrade() !== 'grade7') {
  throw new Error('规范化快照应完整写入本地存储');
}

const beforeFailure = JSON.stringify(storage.getLocalDataSnapshot());
failKey = 'knows_knowledge_notes';
try {
  storage.replaceLocalData({ ...merged, notes: [{ id: 'should-not-persist' }] });
  throw new Error('模拟写入失败应抛出错误');
} catch (error) {
  if (error.message !== 'mock storage full') throw error;
}
if (JSON.stringify(storage.getLocalDataSnapshot()) !== beforeFailure) {
  throw new Error('恢复写入失败后应回滚原有本地数据');
}

let appConfig;
global.App = (config) => {
  appConfig = config;
};
require('../app');
appConfig.restoreLocalData(parsed.data, 'replace');
if (appConfig.globalData.favorites.length !== 1
  || appConfig.globalData.recents.length !== 1
  || appConfig.globalData.searchHistory.length !== 2) {
  throw new Error('恢复后应立即刷新应用会话中的收藏、最近浏览和搜索历史');
}

console.log(`OK backup v${backup.BACKUP_VERSION}, file limits, checksum, merge, replace and rollback checked`);
