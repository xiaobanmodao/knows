const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  PRODUCT_INDEX_SOURCE_ID,
  EXPECTED_VOLUME_KEYS,
  checkEvidence,
} = require('./math-pep-product-index-evidence');

const evidencePath = path.join(__dirname, '..', 'docs/evidence/math-pep-product-index-2026.json');
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

assert.strictEqual(evidence.sourceId, PRODUCT_INDEX_SOURCE_ID);
assert.strictEqual(evidence.schemaVersion, 1);
assert.strictEqual(evidence.result, 'product-index-only');
assert.strictEqual(evidence.volumeMapAction, 'keep-volume-map-blocked');
assert.deepStrictEqual(evidence.entries.map((entry) => entry.key), EXPECTED_VOLUME_KEYS);
assert.strictEqual(evidence.indexSummary.listedVolumeCount, 5);
assert.deepStrictEqual(evidence.indexSummary.omittedFromIndex, ['九年级/上册']);
assert.strictEqual(checkEvidence(evidence), true);

const tamperedAction = { ...evidence, volumeMapAction: 'allow-volume-map' };
assert.throws(() => checkEvidence(tamperedAction), /volumeMapAction|目录门禁/);

const tamperedDirectory = {
  ...evidence,
  entries: evidence.entries.map((entry, index) => (
    index === 0 ? { ...entry, hasChapterDirectory: true } : entry
  )),
};
assert.throws(() => checkEvidence(tamperedDirectory), /章|目录/);

const tamperedIndex = {
  ...evidence,
  indexSummary: { ...evidence.indexSummary, listedVolumeCount: 6 },
};
assert.throws(() => checkEvidence(tamperedIndex), /listedVolumeCount|索引/);

console.log('OK math PEP product index evidence contract');
