const assert = require('assert');

const {
  SOURCE_BATCHES,
  auditContentSourceBatch,
  getContentSourceBatch,
} = require('./check-content-source-batches');

assert.deepStrictEqual(SOURCE_BATCHES.map((batch) => batch.id), [
  'english-units-v1.11',
  'english-words-v1.11',
  'english-grammar-v1.11',
]);
assert.deepStrictEqual(getContentSourceBatch('english-units-v1.11'), SOURCE_BATCHES[0]);
assert.strictEqual(getContentSourceBatch('unknown-batch'), null);

const unitResult = auditContentSourceBatch(getContentSourceBatch('english-units-v1.11'));
assert.deepStrictEqual(unitResult.counts, { entities: 42, aliases: 0 });
assert.deepStrictEqual(unitResult.diff, { added: 0, modified: 0, removed: 0 });
assert.ok(unitResult.entities.every((entity) => entity.subjectId === 'english' && entity.type === 'unit'));

const wordResult = auditContentSourceBatch(getContentSourceBatch('english-words-v1.11'));
assert.deepStrictEqual(wordResult.counts, { entities: 336, aliases: 0 });
assert.deepStrictEqual(wordResult.diff, { added: 0, modified: 0, removed: 0 });
assert.ok(wordResult.entities.every((entity) => entity.subjectId === 'english' && entity.type === 'word'));

const grammarResult = auditContentSourceBatch(getContentSourceBatch('english-grammar-v1.11'));
assert.deepStrictEqual(grammarResult.counts, { entities: 84, aliases: 0 });
assert.deepStrictEqual(grammarResult.diff, { added: 0, modified: 0, removed: 0 });
assert.ok(grammarResult.entities.every((entity) => entity.subjectId === 'english' && entity.type === 'grammar'));

assert.throws(() => auditContentSourceBatch({
  id: 'invalid',
  subjectId: 'english',
  type: 'unit',
  expectedCount: 41,
}), /数量|expected/i);

console.log('OK content source batches contract');
