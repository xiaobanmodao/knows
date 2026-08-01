const { SUBJECT_MANIFEST } = require('../data/subject-manifest');
const noteSubjectFixture = { id: 'synthetic-note-subject', status: 'active' };
SUBJECT_MANIFEST.push(noteSubjectFixture);
const {
  NOTE_SUBJECT_IDS,
  buildNoteFacets,
  filterNotes,
  prepareNotes,
} = require('../utils/note-filter');
SUBJECT_MANIFEST.pop();

const sourceNotes = [
  {
    id: 'math-01',
    subjectId: 'math',
    title: '勾股定理',
    subtitle: '数学 · 勾股定理',
    content: '注意直角三角形条件。',
    tags: ['易错', '几何', '易错'],
    updatedAt: 300,
  },
  {
    id: 'physics-01',
    subjectId: 'physics',
    title: '速度公式',
    content: '平均速度使用 v=s/t，分母是总时间。',
    tags: ['公式', '易错'],
    updatedAt: 500,
  },
  {
    id: 'english-01',
    subjectId: 'english',
    title: '主谓一致',
    content: '先找真正的主语，再判断单复数。',
    tags: ['语法'],
    updatedAt: 400,
  },
  {
    id: 'chemistry-01',
    subjectId: 'chemistry',
    title: '质量守恒定律',
    content: '化学反应前后原子种类和数目不变。',
    tags: ['方程式'],
    updatedAt: 450,
  },
  {
    id: 'legacy-math',
    title: '旧数学笔记',
    tags: ['基础', 'all'],
  },
  null,
  {},
];

const notes = prepareNotes(sourceNotes);
if (!NOTE_SUBJECT_IDS.includes(noteSubjectFixture.id)) {
  throw new Error('笔记学科筛选应从活跃学科清单派生');
}
if (prepareNotes([{ id: 'synthetic-01', subjectId: noteSubjectFixture.id }])[0].subjectId !== noteSubjectFixture.id) {
  throw new Error('笔记应保留清单中的活跃学科');
}
if (notes.length !== 5) throw new Error(`有效笔记应为 5 条，实际 ${notes.length}`);
if (notes[0].id !== 'physics-01' || notes[1].id !== 'chemistry-01' || notes[2].id !== 'english-01') {
  throw new Error('笔记没有按更新时间倒序排列');
}
if (notes.find((note) => note.id === 'legacy-math').subjectId !== 'math') {
  throw new Error('旧笔记缺少 subjectId 时应按数学处理');
}
if (notes.find((note) => note.id === 'math-01').tags.length !== 2) {
  throw new Error('笔记标签应清理空值并去重');
}
if (sourceNotes[0].tags.length !== 3) throw new Error('查询准备过程不应修改原笔记');

const facets = buildNoteFacets(notes);
if (facets.subjectCounts.math !== 2 || facets.subjectCounts.english !== 1
  || facets.subjectCounts.physics !== 1 || facets.subjectCounts.chemistry !== 1) {
  throw new Error('学科笔记数量聚合错误');
}
if (!facets.tags.length || facets.tags[0].id !== '易错' || facets.tags[0].count !== 2) {
  throw new Error('标签应按使用次数降序聚合');
}
if (!facets.tags.some((tag) => tag.id === 'all')) {
  throw new Error('用户标签 all 不应与全部筛选内部值冲突');
}

const checks = [
  [{ subjectId: 'physics' }, ['physics-01']],
  [{ tag: '易错' }, ['physics-01', 'math-01']],
  [{ keyword: '主谓一致' }, ['english-01']],
  [{ keyword: 'v ＝ s ／ t' }, ['physics-01']],
  [{ subjectId: 'math', tag: '几何', keyword: '直角三角形' }, ['math-01']],
  [{ subjectId: 'english', tag: '公式' }, []],
  [{ subjectId: 'chemistry' }, ['chemistry-01']],
  [{ tag: 'all' }, ['legacy-math']],
];

checks.forEach(([filters, expectedIds]) => {
  const actualIds = filterNotes(notes, filters).map((note) => note.id);
  if (actualIds.join(',') !== expectedIds.join(',')) {
    throw new Error(`筛选 ${JSON.stringify(filters)} 应为 ${expectedIds.join(',')}，实际 ${actualIds.join(',')}`);
  }
});

console.log(`OK ${notes.length} note records, 4 subject facets, ${facets.tags.length} tag facets and ${checks.length} filter combinations checked`);
