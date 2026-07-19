const memory = new Map([
  ['knows_favorites', [
    { id: 'ch01-rational-lesson-1', title: '正数和负数', savedAt: 100 },
    { id: 'ch01-rational-lesson-1', title: '重复记录', savedAt: 90 },
  ]],
  ['knows_recents', [
    { id: 'ch03-linear-equation-lesson-2', title: '解一元一次方程', viewedAt: 200 },
  ]],
]);

global.wx = {
  getStorageSync(key) {
    return memory.get(key);
  },
  setStorageSync(key, value) {
    memory.set(key, value);
  },
};

const math = require('../utils/math');
const storage = require('../utils/storage');
const issues = [];

storage.migrateContentStorage(math.resolveKnowledgeId);

const favorites = storage.getFavorites();
const recents = storage.getRecents();

if (favorites.length !== 1 || favorites[0].id === 'ch01-rational-lesson-1') {
  issues.push('收藏迁移后应去重并使用稳定知识点 ID');
}

if (favorites[0].subjectId !== 'math' || favorites[0].type !== 'knowledge') {
  issues.push('旧收藏迁移后应补充 subjectId=math 和 type=knowledge');
}

if (!Object.prototype.hasOwnProperty.call(favorites[0], 'containerId')) {
  issues.push('旧收藏迁移后应补充 containerId');
}

if (!recents.length || recents[0].id === 'ch03-linear-equation-lesson-2') {
  issues.push('最近浏览迁移后应使用稳定知识点 ID');
}

if (memory.get('knows_content_schema_version') !== 3) {
  issues.push('本地内容版本应升级到 3');
}

if (!math.getKnowledgeById('ch01-rational-lesson-1')) {
  issues.push('旧知识点链接应继续可访问');
}

if (storage.getMathGrade() !== 'grade8') {
  issues.push('首次进入数学页应默认八年级');
}

storage.setMathGrade('grade7');
if (storage.getMathGrade() !== 'grade7') {
  issues.push('年级选择应保存在本机');
}

if (issues.length) {
  console.log('FOUND_MIGRATION_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log('OK content storage migration checked');
