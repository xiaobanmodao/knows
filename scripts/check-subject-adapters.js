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

adapters.forEach((adapter) => {
  adapter.getManifestEntities().forEach(({ type, entities }) => {
    assert.ok(type, `${adapter.subjectId} 清单实体必须声明类型`);
    entities.forEach((entity) => {
      assert.ok(entity.id, `${adapter.subjectId}:${type} 清单实体必须有 id`);
    });
  });
});

adapters.flatMap((adapter) => adapter.buildReferenceEntries()).forEach((entry) => {
  assert.ok(
    declaredKindsBySubject.get(entry.subjectId).has(entry.kind),
    `${entry.key} 使用了未在学科清单声明的参考类型 ${entry.kind}`,
  );
});

console.log(`OK ${adapters.length} subject adapters checked`);
