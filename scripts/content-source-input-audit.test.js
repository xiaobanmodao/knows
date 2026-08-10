const assert = require('assert');

const {
  buildContentSourceCatalog,
  buildContentSourceCatalogFromInput,
  diffContentSourceCatalog,
  filterContentSourceCatalog,
} = require('./content-source-catalog');
const { getContentSourceBatch } = require('./check-content-source-batches');
const { normalizeSourceInput } = require('./content-source-input');
const { buildContentSourceInputAuditReport } = require('./content-source-input-audit');

const source = buildContentSourceCatalog();
const batch = getContentSourceBatch('english-units-v1.11');
const current = filterContentSourceCatalog(source, {
  subjectId: batch.subjectId,
  type: batch.type,
});
const input = normalizeSourceInput(current);
const imported = buildContentSourceCatalogFromInput(input);

const report = buildContentSourceInputAuditReport({
  input,
  importedCatalog: imported,
  currentCatalog: current,
  batch,
});

assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.status, 'passed');
assert.strictEqual(report.batchId, batch.id);
assert.deepStrictEqual(report.scope, { subjectId: 'english', type: 'unit' });
assert.deepStrictEqual(report.counts, { entities: 42, aliases: 0 });
assert.deepStrictEqual(report.metrics, { examples: 0, experiments: 0, assets: 42 });
assert.deepStrictEqual(report.review, { verified: 42, reviewed: 0, untracked: 0 });
assert.deepStrictEqual(report.expected, {
  entities: 42,
  aliases: 0,
  examples: 0,
  experiments: 0,
  assets: 42,
});
assert.deepStrictEqual(report.diff.counts, { added: 0, modified: 0, removed: 0 });
assert.strictEqual(report.inputHash, input.inputHash);
assert.strictEqual(report.currentSourceHash, current.sourceHash);
assert.strictEqual(report.importedSourceHash, imported.sourceHash);

const changedInput = normalizeSourceInput({
  ...current,
  entities: current.entities.map((entity, index) => (
    index === 0 ? { ...entity, title: `${entity.title}（外部批次）` } : entity
  )),
});
const changedImported = buildContentSourceCatalogFromInput(changedInput);
const changed = buildContentSourceInputAuditReport({
  input: changedInput,
  importedCatalog: changedImported,
  currentCatalog: current,
  batch,
});
assert.strictEqual(changed.status, 'changed');
assert.deepStrictEqual(changed.diff.counts, { added: 0, modified: 1, removed: 0 });
assert.strictEqual(changed.diff.modified[0].key, current.entities[0].key);

assert.deepStrictEqual(
  diffContentSourceCatalog(current, changedImported).counts,
  changed.diff.counts,
);

console.log('OK content source input audit contract');
