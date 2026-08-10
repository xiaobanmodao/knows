const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildContentSourceCatalog } = require('./content-source-catalog');

const {
  SOURCE_BATCHES,
  auditContentSourceBatch,
  buildContentSourceBatchReport,
  checkContentSourceBatchCoverage,
  getContentSourceBatch,
  writeContentSourceBatchReport,
} = require('./check-content-source-batches');

const expectedBatches = [
  ['english-units-v1.11', 'english', 'unit', 42, { examples: 0, experiments: 0, assets: 42 }],
  ['english-words-v1.11', 'english', 'word', 336, { examples: 672, experiments: 0, assets: 0 }],
  ['english-grammar-v1.11', 'english', 'grammar', 84, { examples: 252, experiments: 0, assets: 0 }],
  ['english-knowledge-v1.11', 'english', 'knowledge', 18, { examples: 54, experiments: 0, assets: 18 }],
  ['english-topics-v1.11', 'english', 'topic', 6, { examples: 0, experiments: 0, assets: 18 }],
  ['english-templates-v1.11', 'english', 'template', 6, { examples: 18, experiments: 0, assets: 6 }],
  ['physics-knowledge-v1.11', 'physics', 'knowledge', 84, { examples: 252, experiments: 29, assets: 84 }],
  ['physics-structured-knowledge-v1.11', 'physics', 'structured-knowledge', 18, { examples: 54, experiments: 6, assets: 18 }],
  ['physics-chapters-v1.11', 'physics', 'chapter', 22, { examples: 0, experiments: 0, assets: 128 }],
  ['physics-topics-v1.11', 'physics', 'topic', 6, { examples: 0, experiments: 0, assets: 18 }],
  ['physics-templates-v1.11', 'physics', 'template', 22, { examples: 66, experiments: 0, assets: 22 }],
  ['physics-structured-templates-v1.11', 'physics', 'structured-template', 6, { examples: 18, experiments: 0, assets: 6 }],
  ['math-chapters-v1.11', 'math', 'chapter', 29, { examples: 0, experiments: 0, assets: 657 }],
  ['math-knowledge-v1.11', 'math', 'knowledge', 89, { examples: 445, experiments: 0, assets: 623 }],
  ['math-topics-v1.11', 'math', 'topic', 29, { examples: 0, experiments: 0, assets: 67 }],
  ['math-templates-v1.11', 'math', 'template', 36, { examples: 36, experiments: 0, assets: 49 }],
  ['chemistry-themes-v1.11', 'chemistry', 'theme', 5, { examples: 0, experiments: 0, assets: 0 }],
  ['chemistry-topics-v1.11', 'chemistry', 'topic', 10, { examples: 0, experiments: 0, assets: 23 }],
  ['chemistry-knowledge-v1.11', 'chemistry', 'knowledge', 40, { examples: 0, experiments: 8, assets: 40 }],
  ['chemistry-templates-v1.11', 'chemistry', 'template', 12, { examples: 12, experiments: 0, assets: 12 }],
  ['biology-topics-v1.11', 'biology', 'topic', 6, { examples: 0, experiments: 0, assets: 12 }],
  ['biology-knowledge-v1.11', 'biology', 'knowledge', 36, { examples: 108, experiments: 6, assets: 36 }],
  ['biology-templates-v1.11', 'biology', 'template', 6, { examples: 0, experiments: 0, assets: 6 }],
];

assert.deepStrictEqual(SOURCE_BATCHES.map((batch) => batch.id), expectedBatches.map(([id]) => id));
assert.deepStrictEqual(checkContentSourceBatchCoverage(), {
  batchCount: 23,
  entityCount: 948,
  scopes: 23,
});
assert.deepStrictEqual(getContentSourceBatch('english-units-v1.11'), SOURCE_BATCHES[0]);
assert.strictEqual(getContentSourceBatch('unknown-batch'), null);

const batchReport = buildContentSourceBatchReport();
assert.strictEqual(batchReport.schemaVersion, 1);
assert.strictEqual(batchReport.sourceVersion, 'v1.11-current');
assert.deepStrictEqual(batchReport.coverage, {
  batchCount: 23,
  entityCount: 948,
  scopes: 23,
});
assert.deepStrictEqual(batchReport.totals, {
  entities: 948,
  aliases: 89,
  examples: 1987,
  experiments: 49,
  assets: 1885,
  review: { verified: 900, reviewed: 48, untracked: 0 },
});
assert.strictEqual(batchReport.sourceHash, buildContentSourceCatalog().sourceHash);
assert.strictEqual(batchReport.batches.length, 23);
assert.deepStrictEqual(batchReport.batches[6], {
  id: 'physics-knowledge-v1.11',
  subjectId: 'physics',
  type: 'knowledge',
  status: 'passed',
  counts: { entities: 84, aliases: 0 },
  metrics: { examples: 252, experiments: 29, assets: 84 },
  review: { verified: 84, reviewed: 0, untracked: 0 },
  diff: { added: 0, modified: 0, removed: 0 },
});

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-source-batches-'));
const reportPath = path.join(tempDirectory, 'batch-report.json');
try {
  writeContentSourceBatchReport(batchReport, reportPath);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(reportPath, 'utf8')), batchReport);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

expectedBatches.forEach(([id, subjectId, type, entityCount, metrics]) => {
  const result = auditContentSourceBatch(getContentSourceBatch(id));
  assert.deepStrictEqual(result.counts, { entities: entityCount, aliases: 0 }, id);
  assert.deepStrictEqual(result.metrics, metrics, id);
  assert.deepStrictEqual(result.diff, { added: 0, modified: 0, removed: 0 }, id);
  assert.ok(result.entities.every((entity) => entity.subjectId === subjectId && entity.type === type), id);
});

assert.throws(() => auditContentSourceBatch({
  id: 'invalid',
  subjectId: 'english',
  type: 'unit',
  expectedCount: 41,
}), /数量|expected/i);
assert.throws(() => auditContentSourceBatch({
  ...getContentSourceBatch('english-units-v1.11'),
  expectedExampleCount: 1,
}), /示例|example/i);

console.log('OK content source batches contract');
