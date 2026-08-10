const assert = require('assert');
const fs = require('fs');
const path = require('path');

const evidencePath = path.join(__dirname, '..', 'docs/evidence/math-smartedu-catalog-2026.json');
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const {
  buildReport,
  checkReport,
  TARGET_VOLUME_KEYS,
} = require('./math-smartedu-edition-evidence');

const report = buildReport(evidence, '2026-08-10T12:00:00.000Z');

assert.deepStrictEqual(report.records.map((record) => `${record.grade}/${record.volume}`), TARGET_VOLUME_KEYS);
assert.strictEqual(report.records.length, 4);
assert.strictEqual(report.editionGate.status, 'blocked-version-inconsistent');
assert.strictEqual(report.editionGate.result, 'no-2022-revised-marker');
assert.strictEqual(report.records.every((record) => record.observations.some((item) => item.page === 1
  && item.signal === 'cover-approval'
  && item.value === '2013')), true);
assert.strictEqual(report.records.filter((record) => record.observations.some((item) => item.signal === 'curriculum-standard'
  && item.value === '2011')).length, 3);
assert.strictEqual(checkReport(evidence, report), true);

assert.throws(
  () => checkReport(evidence, { ...report, editionGate: { ...report.editionGate, status: 'ready' } }),
  /blocked|版本|status/,
);
assert.throws(
  () => checkReport(evidence, {
    ...report,
    records: report.records.map((record, index) => index === 0
      ? { ...record, resourceId: 'unexpected-resource' }
      : record),
  }),
  /resourceId|证据|记录/,
);
assert.throws(
  () => checkReport(evidence, {
    ...report,
    records: report.records.map((record, index) => index === 0
      ? { ...record, observations: record.observations.filter((item) => item.signal !== 'curriculum-standard') }
      : record),
  }),
  /2011|curriculum|课标|观察|observations/,
);

console.log('OK math SmartEdu edition evidence contract: 4 preview records, 2011 legacy signals preserved');
