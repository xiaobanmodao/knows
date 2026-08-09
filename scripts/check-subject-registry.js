const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  SUBJECT_LABELS,
  SUBJECT_MANIFEST,
  getSubjectIds,
  getSubjectMeta,
  getSubjectRegistry,
  getSubjectRoutes,
} = require('../data/subject-manifest');

const appConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../app.json'), 'utf8'));

const COUNT_ALIASES = {
  book: 'bookCount',
  chapter: 'chapterCount',
  unit: 'unitCount',
  topic: 'topicCount',
  knowledge: 'knowledgeCount',
  template: 'templateCount',
  vocabulary: 'vocabularyCount',
  grammar: 'grammarCount',
  example: 'exampleCount',
  experiment: 'experimentCount',
};

function assertValidSubjects(subjects) {
  const ids = new Set();
  subjects.forEach((subject) => {
    assert.ok(subject.id, '学科必须有 id');
    assert.ok(!ids.has(subject.id), `学科 id 重复: ${subject.id}`);
    ids.add(subject.id);
    assert.ok(subject.packageRoot, `${subject.id} 必须有 packageRoot`);
    assert.ok(Array.isArray(subject.packagePages) && subject.packagePages.length, `${subject.id} 必须有非空 packagePages`);
    assert.ok(subject.counts && typeof subject.counts === 'object' && !Array.isArray(subject.counts), `${subject.id} 必须有 counts`);
    assert.deepStrictEqual(
      Object.keys(subject.routes || {}).sort(),
      [...(subject.contentTypes || [])].sort(),
      `${subject.id} 的 routes 必须与 contentTypes 完全对应`,
    );
    Object.entries(subject.counts).forEach(([key, value]) => {
      assert.ok(Number.isInteger(value) && value >= 0, `${subject.id} 的 ${key} 必须是非负整数`);
    });
    Object.entries(COUNT_ALIASES).forEach(([key, alias]) => {
      assert.strictEqual(subject[alias], subject.counts[key] || 0, `${subject.id} 的 ${alias} 必须来自 counts.${key}`);
    });
  });
}

assert.deepStrictEqual(
  getSubjectRegistry().map((item) => item.id),
  ['math', 'english', 'physics', 'chemistry', 'biology'],
);
assertValidSubjects(getSubjectRegistry());

const biology = getSubjectMeta('biology');
const expectedBiology = {
  id: 'biology',
  name: '初中生物',
  shortName: '生物',
  subtitle: '七至八年级生物六单元知识地图',
  description: '按单元梳理生命科学基础知识、观察证据与科学方法。',
  gradeBands: ['七年级', '八年级'],
  theme: 'biology',
  status: 'active',
  packageRoot: 'packages/biology',
  entryRoute: '/packages/biology/pages/index/index',
  packagePages: [
    'pages/index/index',
    'pages/topic/index',
    'pages/knowledge/index',
    'pages/template/index',
  ],
  routes: {
    subject: '/packages/biology/pages/index/index',
    topic: '/packages/biology/pages/topic/index',
    knowledge: '/packages/biology/pages/knowledge/index',
    template: '/packages/biology/pages/template/index',
  },
  contentTypes: ['subject', 'topic', 'knowledge', 'template'],
  referenceKinds: ['experiment'],
  counts: {
    unit: 6,
    topic: 6,
    knowledge: 36,
    template: 6,
    example: 108,
  },
  packageLabel: '6 单元',
};
assert.strictEqual(SUBJECT_LABELS.biology, expectedBiology.shortName);
Object.entries(expectedBiology).forEach(([field, expected]) => {
  assert.deepStrictEqual(biology[field], expected, `biology.${field} 必须匹配已批准的注册契约`);
});
assert.deepStrictEqual(
  (appConfig.subPackages || []).map((item) => item.name),
  ['catalog', 'english', 'physics', 'math', 'chemistry', 'biology'],
  'app.json 必须保留已有分包并注册 biology',
);
assert.deepStrictEqual(
  (appConfig.subPackages || []).find((item) => item.name === 'biology'),
  {
    root: 'packages/biology',
    name: 'biology',
    pages: expectedBiology.packagePages,
  },
  'biology 分包页面必须与 registry 一致',
);

const chemistry = getSubjectMeta('chemistry');
assert.strictEqual(SUBJECT_LABELS.chemistry, '化学');
assert.strictEqual(chemistry.shortName, '化学');
assert.deepStrictEqual(chemistry.gradeBands, ['九年级']);
assert.strictEqual(chemistry.packageRoot, 'packages/chemistry');
assert.deepStrictEqual(chemistry.packagePages, [
  'pages/index/index',
  'pages/topic/index',
  'pages/knowledge/index',
  'pages/template/index',
]);
assert.deepStrictEqual(chemistry.contentTypes, ['subject', 'topic', 'knowledge', 'template']);
assert.deepStrictEqual(chemistry.referenceKinds, ['experiment', 'equation']);
assert.deepStrictEqual(chemistry.counts, {
  theme: 5,
  topic: 10,
  knowledge: 40,
  template: 12,
  experiment: 8,
  equation: 28,
});
const subjectCardStyles = fs.readFileSync(
  path.resolve(__dirname, '../components/subject-card/index.wxss'),
  'utf8',
);
assert.ok(/\.chemistry\s*\{/.test(subjectCardStyles), '化学首页卡片必须有可见的学科主题样式');

const buildingSubject = {
  id: 'synthetic-building',
  name: '构建中学科',
  shortName: '构建中',
  status: 'building',
  packageRoot: 'packages/synthetic-building',
  packagePages: ['pages/index/index'],
  routes: { subject: '/packages/synthetic-building/pages/index/index' },
  contentTypes: ['subject'],
  referenceKinds: [],
  counts: { knowledge: 0 },
};

SUBJECT_MANIFEST.push(buildingSubject);
try {
  assert.deepStrictEqual(
    getSubjectRegistry().map((item) => item.id),
    ['math', 'english', 'physics', 'chemistry', 'biology'],
  );
  const allSubjects = getSubjectRegistry({ includeBuilding: true });
  assert.strictEqual(allSubjects.length, 6);
  assert.strictEqual(allSubjects[5].id, buildingSubject.id);
  assertValidSubjects(allSubjects);
  assert.deepStrictEqual(getSubjectIds(), ['math', 'english', 'physics', 'chemistry', 'biology']);
  assert.deepStrictEqual(getSubjectIds({ includeBuilding: true }), [
    'math', 'english', 'physics', 'chemistry', 'biology', 'synthetic-building',
  ]);
  assert.strictEqual(getSubjectMeta(buildingSubject.id).id, 'math');
  assert.strictEqual(getSubjectMeta(buildingSubject.id, { includeBuilding: true }).id, buildingSubject.id);
  assert.deepStrictEqual(getSubjectRoutes(buildingSubject.id, { includeBuilding: true }), buildingSubject.routes);
} finally {
  SUBJECT_MANIFEST.pop();
}

console.log('OK subject registry capabilities, visibility, routes and count aliases checked');
