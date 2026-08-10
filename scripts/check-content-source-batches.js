const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  buildContentSourceCatalog,
  buildContentSourceCatalogFromInput,
  checkContentSourceCatalog,
  diffContentSourceCatalog,
  filterContentSourceCatalog,
} = require('./content-source-catalog');
const { normalizeSourceInput } = require('./content-source-input');

const EXPECTED_METRICS = Object.freeze([
  Object.freeze({ key: 'examples', field: 'expectedExampleCount' }),
  Object.freeze({ key: 'experiments', field: 'expectedExperimentCount' }),
  Object.freeze({ key: 'assets', field: 'expectedAssetCount' }),
]);

function createBatch(id, subjectId, type, expectedCount, metrics) {
  return Object.freeze({
    id,
    subjectId,
    type,
    expectedCount,
    expectedAliasCount: 0,
    expectedExampleCount: metrics.examples,
    expectedExperimentCount: metrics.experiments,
    expectedAssetCount: metrics.assets,
    status: 'audited',
  });
}

const SOURCE_BATCHES = Object.freeze([
  createBatch('english-units-v1.11', 'english', 'unit', 42, { examples: 0, experiments: 0, assets: 42 }),
  createBatch('english-words-v1.11', 'english', 'word', 336, { examples: 672, experiments: 0, assets: 0 }),
  createBatch('english-grammar-v1.11', 'english', 'grammar', 84, { examples: 252, experiments: 0, assets: 0 }),
  createBatch('english-knowledge-v1.11', 'english', 'knowledge', 18, { examples: 54, experiments: 0, assets: 18 }),
  createBatch('english-topics-v1.11', 'english', 'topic', 6, { examples: 0, experiments: 0, assets: 18 }),
  createBatch('english-templates-v1.11', 'english', 'template', 6, { examples: 18, experiments: 0, assets: 6 }),
  createBatch('physics-knowledge-v1.11', 'physics', 'knowledge', 84, { examples: 252, experiments: 29, assets: 84 }),
  createBatch('physics-structured-knowledge-v1.11', 'physics', 'structured-knowledge', 18, { examples: 54, experiments: 6, assets: 18 }),
  createBatch('physics-chapters-v1.11', 'physics', 'chapter', 22, { examples: 0, experiments: 0, assets: 128 }),
  createBatch('physics-topics-v1.11', 'physics', 'topic', 6, { examples: 0, experiments: 0, assets: 18 }),
  createBatch('physics-templates-v1.11', 'physics', 'template', 22, { examples: 66, experiments: 0, assets: 22 }),
  createBatch('physics-structured-templates-v1.11', 'physics', 'structured-template', 6, { examples: 18, experiments: 0, assets: 6 }),
  createBatch('math-chapters-v1.11', 'math', 'chapter', 29, { examples: 0, experiments: 0, assets: 657 }),
  createBatch('math-knowledge-v1.11', 'math', 'knowledge', 89, { examples: 445, experiments: 0, assets: 623 }),
  createBatch('math-topics-v1.11', 'math', 'topic', 29, { examples: 0, experiments: 0, assets: 67 }),
  createBatch('math-templates-v1.11', 'math', 'template', 36, { examples: 36, experiments: 0, assets: 49 }),
  createBatch('chemistry-themes-v1.11', 'chemistry', 'theme', 5, { examples: 0, experiments: 0, assets: 0 }),
  createBatch('chemistry-topics-v1.11', 'chemistry', 'topic', 10, { examples: 0, experiments: 0, assets: 23 }),
  createBatch('chemistry-knowledge-v1.11', 'chemistry', 'knowledge', 40, { examples: 0, experiments: 8, assets: 40 }),
  createBatch('chemistry-templates-v1.11', 'chemistry', 'template', 12, { examples: 12, experiments: 0, assets: 12 }),
  createBatch('biology-topics-v1.11', 'biology', 'topic', 6, { examples: 0, experiments: 0, assets: 12 }),
  createBatch('biology-knowledge-v1.11', 'biology', 'knowledge', 36, { examples: 108, experiments: 6, assets: 36 }),
  createBatch('biology-templates-v1.11', 'biology', 'template', 6, { examples: 0, experiments: 0, assets: 6 }),
]);

function getContentSourceBatch(batchId) {
  return SOURCE_BATCHES.find((batch) => batch.id === batchId) || null;
}

function scopeKey(value) {
  return `${value.subjectId}/${value.type}`;
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

function checkContentSourceBatchCoverage(catalog = buildContentSourceCatalog()) {
  checkContentSourceCatalog(catalog);
  const registeredScopes = new Set();
  SOURCE_BATCHES.forEach((batch) => {
    validateBatchDefinition(batch);
    const key = scopeKey(batch);
    if (registeredScopes.has(key)) throw new Error(`内容源批次范围重复：${key}`);
    registeredScopes.add(key);
  });
  const sourceScopes = new Set(catalog.entities.map(scopeKey));
  const missing = [...sourceScopes].filter((key) => !registeredScopes.has(key)).sort();
  const stale = [...registeredScopes].filter((key) => !sourceScopes.has(key)).sort();
  if (missing.length || stale.length) {
    throw new Error(`内容源批次覆盖不完整：missing=${missing.join('|') || '-'}; stale=${stale.join('|') || '-'}`);
  }
  return {
    batchCount: SOURCE_BATCHES.length,
    entityCount: catalog.entities.length,
    scopes: sourceScopes.size,
  };
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

function buildContentSourceBatchReport(catalog = buildContentSourceCatalog()) {
  const coverage = checkContentSourceBatchCoverage(catalog);
  const results = SOURCE_BATCHES.map((batch) => auditContentSourceBatch(batch, catalog));
  const metrics = results.reduce((totals, result) => ({
    examples: totals.examples + result.metrics.examples,
    experiments: totals.experiments + result.metrics.experiments,
    assets: totals.assets + result.metrics.assets,
  }), { examples: 0, experiments: 0, assets: 0 });
  const review = catalog.entities.reduce((counts, entity) => ({
    ...counts,
    [entity.review.status]: counts[entity.review.status] + 1,
  }), { verified: 0, reviewed: 0, untracked: 0 });

  return {
    schemaVersion: 1,
    sourceVersion: catalog.sourceVersion,
    sourceHash: catalog.sourceHash,
    coverage,
    totals: {
      entities: catalog.entityCount,
      aliases: catalog.aliasCount,
      ...metrics,
      review,
    },
    batches: results.map((result) => ({
      id: result.batch.id,
      subjectId: result.batch.subjectId,
      type: result.batch.type,
      status: 'passed',
      counts: result.counts,
      metrics: result.metrics,
      review: result.entities.reduce((counts, entity) => ({
        ...counts,
        [entity.review.status]: counts[entity.review.status] + 1,
      }), { verified: 0, reviewed: 0, untracked: 0 }),
      diff: result.diff,
    })),
  };
}

function writeContentSourceBatchReport(report, outputPath) {
  assert(report && report.schemaVersion === 1, '内容源批次报告无效');
  const absolutePath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return absolutePath;
}

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const report = buildContentSourceBatchReport();
  const outputPath = getOption('--report');
  if (outputPath) {
    writeContentSourceBatchReport(report, outputPath);
    console.log(`Report: ${path.resolve(outputPath)}`);
  }
  report.batches.forEach((batch) => {
    console.log(`OK content source batch ${batch.id}: ${batch.counts.entities} entities, ${batch.metrics.examples} examples, ${batch.metrics.experiments} experiments, ${batch.metrics.assets} assets, diff +${batch.diff.added} ~${batch.diff.modified} -${batch.diff.removed}`);
  });
  console.log(`OK content source batch report: ${report.totals.entities} entities, ${report.totals.aliases} aliases`);
}

if (require.main === module) main();

module.exports = {
  SOURCE_BATCHES,
  auditContentSourceBatch,
  buildContentSourceBatchReport,
  checkContentSourceBatchCoverage,
  getContentSourceBatch,
  writeContentSourceBatchReport,
};
