const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  CATALOG_MIRROR_SOURCE_ID,
  EXPECTED_MATH_ROW,
  checkEvidence,
} = require('./math-moe-catalog-mirror-evidence');

const evidencePath = path.join(__dirname, '..', 'docs/evidence/math-moe-catalog-mirror-2026.json');
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

assert.strictEqual(evidence.sourceId, CATALOG_MIRROR_SOURCE_ID);
assert.strictEqual(evidence.schemaVersion, 1);
assert.strictEqual(evidence.result, 'version-scope-only');
assert.strictEqual(evidence.chapterDirectoryIncluded, false);
assert.strictEqual(evidence.volumeMapAction, 'keep-volume-map-blocked');
assert.deepStrictEqual(evidence.mathRows, [EXPECTED_MATH_ROW]);
assert.strictEqual(checkEvidence(evidence), true);

const tamperedSource = { ...evidence, sourceId: 'pep-math-product-index-2026' };
assert.throws(() => checkEvidence(tamperedSource), /sourceId|来源/);

const tamperedDirectory = { ...evidence, chapterDirectoryIncluded: true };
assert.throws(() => checkEvidence(tamperedDirectory), /章|目录/);

const tamperedRow = {
  ...evidence,
  mathRows: [{ ...EXPECTED_MATH_ROW, publisher: '未知出版社' }],
};
assert.throws(() => checkEvidence(tamperedRow), /人民教育出版社|数学条目/);

const tamperedAction = { ...evidence, volumeMapAction: 'allow-volume-map' };
assert.throws(() => checkEvidence(tamperedAction), /volumeMapAction|目录门禁/);

console.log('OK math MOE catalog mirror evidence contract');
