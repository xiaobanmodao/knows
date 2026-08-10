const assert = require('assert');

const {
  buildContentSourceCatalog,
  buildContentSourceCatalogFromInput,
  diffContentSourceCatalog,
  filterContentSourceCatalog,
} = require('./content-source-catalog');
const { normalizeSourceInput } = require('./content-source-input');

const EXPECTED_METRICS = Object.freeze([
  Object.freeze({ key: 'examples', field: 'expectedExampleCount' }),
  Object.freeze({ key: 'experiments', field: 'expectedExperimentCount' }),
  Object.freeze({ key: 'assets', field: 'expectedAssetCount' }),
]);

const SOURCE_BATCHES = Object.freeze([
  Object.freeze({
    id: 'english-units-v1.11',
    subjectId: 'english',
    type: 'unit',
    expectedCount: 42,
    expectedAliasCount: 0,
    expectedExampleCount: 0,
    expectedExperimentCount: 0,
    expectedAssetCount: 42,
    status: 'audited',
  }),
  Object.freeze({
    id: 'english-words-v1.11',
    subjectId: 'english',
    type: 'word',
    expectedCount: 336,
    expectedAliasCount: 0,
    expectedExampleCount: 672,
    expectedExperimentCount: 0,
    expectedAssetCount: 0,
    status: 'audited',
  }),
  Object.freeze({
    id: 'english-grammar-v1.11',
    subjectId: 'english',
    type: 'grammar',
    expectedCount: 84,
    expectedAliasCount: 0,
    expectedExampleCount: 252,
    expectedExperimentCount: 0,
    expectedAssetCount: 0,
    status: 'audited',
  }),
  Object.freeze({
    id: 'physics-knowledge-v1.11',
    subjectId: 'physics',
    type: 'knowledge',
    expectedCount: 84,
    expectedAliasCount: 0,
    expectedExampleCount: 252,
    expectedExperimentCount: 29,
    expectedAssetCount: 84,
    status: 'audited',
  }),
  Object.freeze({
    id: 'physics-structured-knowledge-v1.11',
    subjectId: 'physics',
    type: 'structured-knowledge',
    expectedCount: 18,
    expectedAliasCount: 0,
    expectedExampleCount: 54,
    expectedExperimentCount: 6,
    expectedAssetCount: 18,
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
  EXPECTED_METRICS.forEach(({ field }) => {
    if (!Number.isInteger(batch[field]) || batch[field] < 0) {
      throw new Error(`内容源批次 ${batch.id} ${field} 无效`);
    }
  });
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
  const metrics = scoped.entities.reduce((totals, entity) => ({
    examples: totals.examples + entity.exampleCount,
    experiments: totals.experiments + entity.experimentCount,
    assets: totals.assets + entity.assetCount,
  }), { examples: 0, experiments: 0, assets: 0 });
  EXPECTED_METRICS.forEach(({ key, field }) => {
    assert.strictEqual(
      metrics[key],
      batch[field],
      `${batch.id} ${key} 数量不符：expected ${batch[field]}, got ${metrics[key]}`,
    );
  });

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
    metrics,
    diff: diff.counts,
    entities: scoped.entities,
    aliases: scoped.aliases,
  };
}

function main() {
  SOURCE_BATCHES.forEach((batch) => {
    const result = auditContentSourceBatch(batch);
    console.log(`OK content source batch ${batch.id}: ${result.counts.entities} entities, ${result.metrics.examples} examples, ${result.metrics.experiments} experiments, ${result.metrics.assets} assets, diff +0 ~0 -0`);
  });
}

if (require.main === module) main();

module.exports = {
  SOURCE_BATCHES,
  auditContentSourceBatch,
  getContentSourceBatch,
};
