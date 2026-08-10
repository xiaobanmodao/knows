const assert = require('assert');

const {
  normalizeSourceInput,
  checkSourceInput,
} = require('./content-source-input');
const {
  buildContentSourceCatalog,
  buildContentSourceCatalogFromInput,
  checkContentSourceCatalog,
  diffContentSourceCatalog,
  filterContentSourceCatalog,
} = require('./content-source-catalog');

const baseRecord = {
  key: 'math:knowledge:fixture-knowledge',
  subjectId: 'math',
  type: 'knowledge',
  id: 'fixture-knowledge',
  title: 'Fixture knowledge',
  parentId: null,
  review: {
    status: 'verified',
    reviewedAt: '2026-08-10',
    sourceKeys: ['pep-math', 'moe-standard'],
  },
  contentHash: 'a'.repeat(64),
  exampleCount: 2,
  experimentCount: 0,
  assetCount: 1,
};

const normalized = normalizeSourceInput({
  schemaVersion: 1,
  sourceVersion: 'fixture-v1',
  entities: [baseRecord],
  aliases: [],
});
checkSourceInput(normalized);
assert.deepStrictEqual(normalized.entities[0].review.sourceKeys, ['moe-standard', 'pep-math']);
assert.strictEqual(normalized.entityCount, 1);
assert.strictEqual(normalized.aliasCount, 0);
assert.ok(/^[a-f0-9]{64}$/.test(normalized.inputHash));
checkSourceInput(buildContentSourceCatalog());
const importedCatalog = buildContentSourceCatalogFromInput(normalized);
  checkContentSourceCatalog(importedCatalog, { allowAnySourceVersion: true });
assert.deepStrictEqual(diffContentSourceCatalog(importedCatalog, importedCatalog).counts, {
  added: 0,
  modified: 0,
  removed: 0,
});
const englishUnits = filterContentSourceCatalog(buildContentSourceCatalog(), { subjectId: 'english', type: 'unit' });
checkContentSourceCatalog(englishUnits, { allowAnySourceVersion: true });
assert.strictEqual(englishUnits.entityCount, 42);
assert.ok(englishUnits.entities.every((entity) => entity.subjectId === 'english' && entity.type === 'unit'));

const tampered = JSON.parse(JSON.stringify(normalized));
tampered.entities[0].title = 'Tampered title';
assert.throws(() => checkSourceInput(tampered), /inputHash|哈希/);

assert.throws(
  () => normalizeSourceInput({
    schemaVersion: 1,
    sourceVersion: 'fixture-v1',
    entities: [baseRecord, { ...baseRecord }],
    aliases: [],
  }),
  /重复|duplicate/i,
);

assert.throws(
  () => normalizeSourceInput({
    schemaVersion: 1,
    sourceVersion: 'fixture-v1',
    entities: [{ ...baseRecord, summary: '正文不得进入元数据输入' }],
    aliases: [],
  }),
  /正文字段|body|summary/i,
);

assert.throws(
  () => normalizeSourceInput({
    schemaVersion: 1,
    sourceVersion: 'fixture-v1',
    entities: [{ ...baseRecord, contentHash: 'not-a-hash' }],
    aliases: [],
  }),
  /哈希|hash/i,
);

assert.throws(
  () => normalizeSourceInput({
    schemaVersion: 1,
    sourceVersion: 'fixture-v1',
    entities: [{ ...baseRecord, review: { ...baseRecord.review, status: 'draft' } }],
    aliases: [],
  }),
  /复核状态|status/i,
);

assert.throws(
  () => normalizeSourceInput({
    schemaVersion: 1,
    sourceVersion: 'fixture-v1',
    entities: [{ ...baseRecord, exampleCount: -1 }],
    aliases: [],
  }),
  /数量|count/i,
);

console.log('OK content source input contract');
