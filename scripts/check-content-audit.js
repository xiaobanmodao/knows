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
assert.ok(report.totals && typeof report.totals.entityCount === 'number', '审计报告必须包含总实体数');
assert.strictEqual(report.references.coverage, 'all-reference-entries', '参考索引哈希必须覆盖全部参考入口');

console.log(`OK content audit contract: ${report.totals.entityCount} entities across ${report.subjects.length} subjects${process.argv.includes('--require-reviewed') ? ' (strict review)' : ''}`);
