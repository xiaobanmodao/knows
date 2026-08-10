const assert = require('assert');

const {
  SOURCE_BATCHES,
  auditContentSourceBatch,
  checkContentSourceBatchCoverage,
  getContentSourceBatch,
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
