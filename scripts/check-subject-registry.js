const assert = require('assert');

const {
  SUBJECT_MANIFEST,
  getSubjectIds,
  getSubjectMeta,
  getSubjectRegistry,
  getSubjectRoutes,
} = require('../data/subject-manifest');

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
  ['math', 'english', 'physics'],
);
assertValidSubjects(getSubjectRegistry());

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
    ['math', 'english', 'physics'],
  );
  const allSubjects = getSubjectRegistry({ includeBuilding: true });
  assert.strictEqual(allSubjects.length, 4);
  assert.strictEqual(allSubjects[3].id, buildingSubject.id);
  assertValidSubjects(allSubjects);
  assert.deepStrictEqual(getSubjectIds(), ['math', 'english', 'physics']);
  assert.deepStrictEqual(getSubjectIds({ includeBuilding: true }), [
    'math', 'english', 'physics', 'synthetic-building',
  ]);
  assert.strictEqual(getSubjectMeta(buildingSubject.id).id, 'math');
  assert.strictEqual(getSubjectMeta(buildingSubject.id, { includeBuilding: true }).id, buildingSubject.id);
  assert.deepStrictEqual(getSubjectRoutes(buildingSubject.id, { includeBuilding: true }), buildingSubject.routes);
} finally {
  SUBJECT_MANIFEST.pop();
}

console.log('OK subject registry capabilities, visibility, routes and count aliases checked');
