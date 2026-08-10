const assert = require('assert');

const {
  buildContentSourceCatalog,
  buildContentSourceCatalogFromInput,
  diffContentSourceCatalog,
  filterContentSourceCatalog,
} = require('./content-source-catalog');
const { normalizeSourceInput } = require('./content-source-input');

const SOURCE_BATCHES = Object.freeze([
  Object.freeze({
    id: 'english-units-v1.11',
    subjectId: 'english',
    type: 'unit',
    expectedCount: 42,
    expectedAliasCount: 0,
    status: 'audited',
  }),
  Object.freeze({
    id: 'english-words-v1.11',
    subjectId: 'english',
    type: 'word',
    expectedCount: 336,
    expectedAliasCount: 0,
    status: 'audited',
  }),
  Object.freeze({
    id: 'english-grammar-v1.11',
    subjectId: 'english',
    type: 'grammar',
    expectedCount: 84,
    expectedAliasCount: 0,
    status: 'audited',
  }),
]);

function getContentSourceBatch(batchId) {
  return SOURCE_BATCHES.find((batch) => batch.id === batchId) || null;
}

function validateBatchDefinition(batch) {
  if (!batch || typeof batch !== 'object') throw new Error('内容源批次定义必须为对象');
  if (!batch.id || !batch.subjectId || !batch.type) throw new Error('内容源批次定义字段不完整');
  if (!Number.isInteger(batch.expectedCount) || batch.expectedCount < 0) {
    throw new Error(`内容源批次 ${batch.id} expectedCount 无效`);
  }
  if (!Number.isInteger(batch.expectedAliasCount) || batch.expectedAliasCount < 0) {
    throw new Error(`内容源批次 ${batch.id} expectedAliasCount 无效`);
  }
}

function auditContentSourceBatch(batch, catalog = buildContentSourceCatalog()) {
  validateBatchDefinition(batch);
  const scoped = filterContentSourceCatalog(catalog, {
    subjectId: batch.subjectId,
    type: batch.type,
  });
  assert.strictEqual(
    scoped.entityCount,
    batch.expectedCount,
    `${batch.id} 实体数量不符：expected ${batch.expectedCount}, got ${scoped.entityCount}`,
  );
  assert.strictEqual(
    scoped.aliasCount,
    batch.expectedAliasCount,
    `${batch.id} 别名数量不符：expected ${batch.expectedAliasCount}, got ${scoped.aliasCount}`,
  );
  assert.ok(
    scoped.entities.every((entity) => entity.subjectId === batch.subjectId && entity.type === batch.type),
    `${batch.id} 混入了其他学科或实体类型`,
  );

  const importedCatalog = buildContentSourceCatalogFromInput(normalizeSourceInput(scoped));
  const diff = diffContentSourceCatalog(scoped, importedCatalog);
  assert.deepStrictEqual(
    diff.counts,
    { added: 0, modified: 0, removed: 0 },
    `${batch.id} 导入干跑存在差异`,
  );
  return {
    batch,
    counts: { entities: scoped.entityCount, aliases: scoped.aliasCount },
    diff: diff.counts,
    entities: scoped.entities,
    aliases: scoped.aliases,
  };
}

function main() {
  SOURCE_BATCHES.forEach((batch) => {
    const result = auditContentSourceBatch(batch);
    console.log(`OK content source batch ${batch.id}: ${result.counts.entities} entities, ${result.counts.aliases} aliases, diff +0 ~0 -0`);
  });
}

if (require.main === module) main();

module.exports = {
  SOURCE_BATCHES,
  auditContentSourceBatch,
  getContentSourceBatch,
};
