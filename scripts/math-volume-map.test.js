const assert = require('assert');

const {
  collectMathCurriculumAudit,
  checkMathCurriculumAudit,
} = require('./math-curriculum-audit');
const { getContentSource } = require('../data/content-source-registry');

const report = collectMathCurriculumAudit();

assert.strictEqual(report.volumeMap.schemaVersion, 1);
assert.strictEqual(report.volumeMap.status, 'needs-official-volume-map');
assert.strictEqual(report.volumeMap.entries.length, 29);
assert.strictEqual(new Set(report.volumeMap.entries.map((entry) => entry.stableChapterId)).size, 29);

assert.deepStrictEqual(
  report.sources.map((source) => source.id),
  ['moe-math-curriculum-2022', 'moe-textbook-catalog-2024', 'pep-math-new-textbook-2024'],
);
report.sources.forEach((source) => {
  const registered = getContentSource(source.id);
  assert.ok(registered, `${source.id}: 来源键必须登记在统一注册表`);
  assert.strictEqual(registered.url, source.url, `${source.id}: URL 必须使用注册表规范值`);
  assert.strictEqual(registered.kind, 'official', `${source.id}: 数学目录来源必须是官方来源`);
  assert.ok(source.evidence && source.evidence.locator, `${source.id}: 缺少官方证据定位`);
  assert.ok(source.evidence.scope, `${source.id}: 缺少证据范围说明`);
  assert.ok(!Number.isNaN(Date.parse(source.evidence.reviewedAt)), `${source.id}: 复核日期无效`);
});

assert.deepStrictEqual(report.sourceMap.requiredEvidenceFields, [
  'textbookEdition',
  'officialGrade',
  'officialVolume',
  'officialChapterNo',
  'officialTitle',
  'officialSections',
  'sourceIds',
  'sourceEvidence',
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
report.confirmedChanges.forEach((change) => {
  assert.ok(change.evidenceLocator, `${change.id}: 缺少官方证据定位`);
  assert.ok(change.evidenceScope, `${change.id}: 缺少证据范围说明`);
});

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

const tamperedSourceEvidence = JSON.parse(JSON.stringify(report));
delete tamperedSourceEvidence.sources[0].evidence.locator;
assert.throws(
  () => checkMathCurriculumAudit(tamperedSourceEvidence),
  /证据定位/,
);

const tamperedChangeEvidence = JSON.parse(JSON.stringify(report));
delete tamperedChangeEvidence.confirmedChanges[0].evidenceScope;
assert.throws(
  () => checkMathCurriculumAudit(tamperedChangeEvidence),
  /证据定位/,
);

checkMathCurriculumAudit(report);
console.log('OK math volume map contract');
