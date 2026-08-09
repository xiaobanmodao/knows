const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { collectContentAudit, checkAuditReport } = require('./content-audit');

const report = collectContentAudit();
checkAuditReport(report, {
  requireReviewed: process.argv.includes('--require-reviewed'),
});

const outputPath = path.resolve(__dirname, '../dist/content-audit/content-audit.json');
if (!fs.existsSync(outputPath)) {
  throw new Error('审计报告不存在，请先运行 node scripts/build-content-audit.js');
}
const generatedReport = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
assert.deepStrictEqual(generatedReport, report, '已生成的审计报告与当前内容源不一致，请重新构建');

assert.strictEqual(report.schemaVersion, 1, '审计报告 schemaVersion 必须为 1');
assert.deepStrictEqual(
  report.subjects.map((subject) => subject.id),
  ['biology', 'chemistry', 'english', 'math', 'physics'],
  '审计报告必须覆盖五个启用学科并保持稳定顺序',
);
const subjectKeys = [
  'id', 'name', 'status', 'packageRoot', 'counts', 'registryCounts',
  'reviewed', 'examples', 'experiments', 'assets', 'issues',
];
report.subjects.forEach((subject) => {
  subjectKeys.forEach((key) => assert.ok(Object.prototype.hasOwnProperty.call(subject, key), `学科报告缺少字段：${subject.id}/${key}`));
  ['examples', 'experiments', 'assets'].forEach((key) => assert.ok(Number.isInteger(subject[key]) && subject[key] >= 0, `学科报告数量无效：${subject.id}/${key}`));
  assert.strictEqual(subject.reviewed.total, Object.values(subject.counts).filter((value) => Number.isInteger(value)).reduce((sum, value) => sum + value, 0) - subject.examples - subject.experiments - subject.assets, `学科复核总数异常：${subject.id}`);
});
const totalKeys = ['entityCount', 'manifestEntityCount', 'exampleCount', 'experimentCount', 'assetReferenceCount', 'sourceReferenceCount', 'reviewedCount', 'untrackedCount'];
assert.ok(report.totals, '审计报告必须包含总量');
totalKeys.forEach((key) => assert.ok(Number.isInteger(report.totals[key]) && report.totals[key] >= 0, `审计总量无效：${key}`));
assert.strictEqual(report.totals.reviewedCount + report.totals.untrackedCount, report.totals.entityCount, '复核总量与实体总量不一致');
['baselineVersion', 'currentVersion', 'baselineCount', 'currentCount', 'added', 'modified', 'removed', 'sourceHash']
  .forEach((key) => assert.ok(Object.prototype.hasOwnProperty.call(report.contentDiff, key), `内容差异缺少字段：${key}`));
['entryCount', 'sourceHash', 'subjectCounts', 'coverage']
  .forEach((key) => assert.ok(Object.prototype.hasOwnProperty.call(report.search, key), `搜索摘要缺少字段：${key}`));
assert.strictEqual(report.search.coverage.expectedEntityCount, report.search.entryCount, '搜索覆盖数量与索引数量不一致');
assert.deepStrictEqual(report.search.coverage.missingEntityKeys, [], '搜索摘要仍有漏检实体');
assert.strictEqual(report.references.coverage, 'all-reference-entries', '参考索引哈希必须覆盖全部参考入口');
['word', 'grammar', 'formula', 'experiment', 'equation'].forEach((kind) => {
  assert.ok(Number.isInteger(report.references.counts[kind]) && report.references.counts[kind] >= 0, `参考计数无效：${kind}`);
});
assert.strictEqual(
  Object.values(report.references.counts).reduce((sum, count) => sum + count, 0),
  report.references.entryCount,
  '参考计数与入口总数不一致',
);

console.log(`OK content audit contract: ${report.totals.entityCount} entities across ${report.subjects.length} subjects${process.argv.includes('--require-reviewed') ? ' (strict review)' : ''}`);
