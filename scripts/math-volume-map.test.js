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

assert.deepStrictEqual(report.sourceMap.requiredEvidenceFields, [
  'textbookEdition',
  'officialGrade',
  'officialVolume',
  'officialChapterNo',
  'officialTitle',
  'officialSections',
  'sourceIds',
  'reviewedAt',
  'changeReason',
  'legacyAliasImpact',
]);
assert.strictEqual(report.sourceMap.status, 'needs-official-volume-map');
assert.strictEqual(report.sourceMap.pendingEntryCount, 29);
assert.deepStrictEqual(report.sourceMap.pendingEvidenceFields, report.sourceMap.requiredEvidenceFields);
assert.strictEqual(report.stability.chapter.actualCount, 29);
assert.strictEqual(report.stability.lesson.actualCount, 89);
assert.strictEqual(report.stability.lesson.legacyAliasCount, 89);
assert.deepStrictEqual(report.stability.lesson.duplicateLessonIds, []);
assert.deepStrictEqual(report.stability.lesson.mismatchedLegacyIds, []);
assert.deepStrictEqual(report.diffSummary.counts, { added: 0, modified: 2, removed: 0 });
assert.deepStrictEqual(
  report.diffSummary.modified.map((item) => item.id),
  ['math-function-split', 'math-data-analysis-additions'],
);

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

const tamperedAliases = JSON.parse(JSON.stringify(report));
tamperedAliases.stability.lesson.mismatchedLegacyIds = ['ch01-rational-lesson-1'];
assert.throws(
  () => checkMathCurriculumAudit(tamperedAliases),
  /稳定 ID|旧别名|差异报告/,
);

checkMathCurriculumAudit(report);
console.log('OK math volume map contract');
