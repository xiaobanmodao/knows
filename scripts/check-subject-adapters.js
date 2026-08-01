const assert = require('assert');

const adapters = require('./subject-adapters');
const {
  getSubjectIds,
  getSubjectRegistry,
} = require('../data/subject-manifest');

const REQUIRED = ['getManifestEntities', 'buildSearchEntries', 'buildReferenceEntries', 'validate'];
const activeSubjects = getSubjectRegistry({ includeBuilding: true })
  .filter((subject) => subject.status !== 'building');
const expectedSubjectIds = getSubjectIds({ includeBuilding: true })
  .filter((subjectId) => activeSubjects.some((subject) => subject.id === subjectId));
const declaredKindsBySubject = new Map(activeSubjects.map((subject) => [
  subject.id,
  new Set(subject.referenceKinds || []),
]));

assert.deepStrictEqual(
  adapters.map((adapter) => adapter.subjectId),
  expectedSubjectIds,
  '适配器学科顺序必须与活动学科清单一致',
);

adapters.forEach((adapter) => {
  assert.strictEqual(typeof adapter.subjectId, 'string', '适配器必须声明 subjectId');
  assert.deepStrictEqual(
    Object.keys(adapter).sort(),
    ['subjectId', ...REQUIRED].sort(),
    `${adapter.subjectId} 导出接口不完整`,
  );
  REQUIRED.forEach((name) => {
    assert.strictEqual(typeof adapter[name], 'function', `${adapter.subjectId}.${name}`);
  });
  adapter.validate();
});

function makeEntry(entry) {
  return {
    ...entry,
    key: `${entry.subjectId}:${entry.type}:${entry.focusId || entry.refId}`,
  };
}

const searchEntries = adapters.flatMap((adapter) => adapter.buildSearchEntries(makeEntry));
const searchKeys = searchEntries.map((entry) => entry.key);
assert.strictEqual(new Set(searchKeys).size, searchKeys.length, '搜索索引 key 必须唯一');
assert.strictEqual(
  searchEntries.filter((entry) => entry.subjectId === 'chemistry').length,
  62,
  '化学适配器必须生成 10 专题、40 知识点和 12 方法搜索记录',
);

const chemistryAdapter = adapters.find((adapter) => adapter.subjectId === 'chemistry');
assert.ok(chemistryAdapter, '缺少化学构建适配器');
assert.deepStrictEqual(
  chemistryAdapter.getManifestEntities().map((group) => group.type),
  ['theme', 'topic', 'knowledge', 'template'],
  '化学清单实体顺序或类型不正确',
);

adapters.forEach((adapter) => {
  adapter.getManifestEntities().forEach(({ type, entities }) => {
    assert.ok(type, `${adapter.subjectId} 清单实体必须声明类型`);
    entities.forEach((entity) => {
      assert.ok(entity.id, `${adapter.subjectId}:${type} 清单实体必须有 id`);
    });
  });
});

const referenceEntries = adapters.flatMap((adapter) => adapter.buildReferenceEntries());
referenceEntries.forEach((entry) => {
  assert.ok(
    declaredKindsBySubject.get(entry.subjectId).has(entry.kind),
    `${entry.key} 使用了未在学科清单声明的参考类型 ${entry.kind}`,
  );
});

const chemistryReferences = referenceEntries.filter((entry) => entry.subjectId === 'chemistry');
assert.strictEqual(chemistryReferences.filter((entry) => entry.kind === 'experiment').length, 8);
assert.strictEqual(chemistryReferences.filter((entry) => entry.kind === 'equation').length, 28);
assert.strictEqual(new Set(chemistryReferences.map((entry) => entry.key)).size, 36);
chemistryReferences.forEach((entry) => {
  assert.ok(entry.refId && entry.containerId && entry.focusId, `${entry.key} 缺少归属知识或定位 ID`);
});

console.log(`OK ${adapters.length} subject adapters checked`);
