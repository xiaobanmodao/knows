const assert = require('assert');

const {
  collectMathCurriculumAudit,
  checkMathCurriculumAudit,
} = require('./math-curriculum-audit');

const report = collectMathCurriculumAudit();

assert.strictEqual(report.volumeMap.schemaVersion, 1);
assert.strictEqual(report.volumeMap.status, 'needs-official-volume-map');
assert.strictEqual(report.volumeMap.entries.length, 29);
assert.strictEqual(new Set(report.volumeMap.entries.map((entry) => entry.stableChapterId)).size, 29);

report.volumeMap.entries.forEach((entry) => {
  assert.strictEqual(entry.mappingStatus, 'needs-official-volume-map');
  assert.deepStrictEqual(entry.official, null);
  assert.ok(Array.isArray(entry.sourceIds) && entry.sourceIds.length >= 2);
  assert.ok(entry.current && entry.current.title && entry.current.chapterNo);
});

const tampered = JSON.parse(JSON.stringify(report));
tampered.volumeMap.entries[0].official = {
  grade: '七年级',
  volume: '上册',
  chapterNo: 1,
};
assert.throws(
  () => checkMathCurriculumAudit(tampered),
  /官方逐册映射|官方册次|官方章号/,
);

checkMathCurriculumAudit(report);
console.log('OK math volume map contract');
