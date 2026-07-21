const memory = new Map([
  ['knows_favorites', [
    { id: 'ch01-rational-lesson-1', title: '正数和负数', savedAt: 100 },
    { id: 'ch01-rational-lesson-1', title: '重复记录', savedAt: 90 },
  ]],
  ['knows_recents', [
    { id: 'ch03-linear-equation-lesson-2', title: '解一元一次方程', viewedAt: 200 },
  ]],
  ['knows_knowledge_notes', [
    { id: 'ch01-rational-lesson-1', title: '旧笔记', content: '保留这条笔记', tags: ['基础'] },
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

const math = require('../packages/math/repository');
const storage = require('../utils/storage');
const issues = [];

storage.migrateContentStorage(math.resolveKnowledgeId);

const favorites = storage.getFavorites();
const recents = storage.getRecents();
const migratedNotes = storage.getNotes();

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

if (!migratedNotes.length || migratedNotes[0].id === 'ch01-rational-lesson-1') {
  issues.push('旧数学笔记应迁移到稳定知识点 ID');
}

if (memory.get('knows_content_schema_version') !== 4) {
  issues.push('本地内容版本应升级到 4');
}

if (!math.getKnowledgeById('ch01-rational-lesson-1')) {
  issues.push('旧知识点链接应继续可访问');
}

if (math.getKnowledgeNavigation('math', 'ch01-rational-lesson-1').index !== 0) {
  issues.push('旧知识点链接迁移后应保留相邻知识导航');
}

if (storage.getMathGrade() !== 'grade8') {
  issues.push('首次进入数学页应默认八年级');
}

storage.setMathGrade('grade7');
if (storage.getMathGrade() !== 'grade7') {
  issues.push('年级选择应保存在本机');
}

const readingItem = {
  id: favorites[0].id,
  subjectId: 'math',
  title: '正数和负数',
  subtitle: '数学 · 有理数',
  containerId: 'ch01-rational',
};
storage.saveReadingPosition(readingItem, 628.4, {
  detailsExpanded: true,
  templateExpanded: false,
  expandedProblems: ['problem-01'],
});
const readingPosition = storage.getReadingPosition('math', readingItem.id);
const lastReading = storage.getLastReading();

if (!readingPosition || readingPosition.scrollTop !== 628 || !readingPosition.viewState.detailsExpanded) {
  issues.push('阅读位置和折叠状态应保存在本机');
}

if (!lastReading || lastReading.id !== readingItem.id) {
  issues.push('最后阅读内容应可用于首页继续阅读');
}

const savedNote = storage.saveKnowledgeNote({
  ...readingItem,
  content: '  注意正负号和相反数。  ',
  tags: ['易错', '易错', '数轴', '符号', '计算', '边界', '多余'],
});

if (!savedNote || savedNote.content !== '注意正负号和相反数。' || savedNote.tags.length !== 5) {
  issues.push('本地笔记应清理正文并对标签去重、限量');
}

storage.saveKnowledgeNote({ ...readingItem, content: '', tags: [] });
if (storage.getKnowledgeNote('math', readingItem.id)) {
  issues.push('空正文且无标签时应清除笔记');
}

if (issues.length) {
  console.log('FOUND_MIGRATION_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log('OK content storage migration checked');
