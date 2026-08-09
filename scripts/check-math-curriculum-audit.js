const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { MATH_CURRICULUM_BASELINE } = require('../packages/math/data/math-curriculum-baseline');
const {
  collectMathCurriculumAudit,
  checkMathCurriculumAudit,
} = require('./math-curriculum-audit');

const report = collectMathCurriculumAudit();
checkMathCurriculumAudit(report);

assert.strictEqual(MATH_CURRICULUM_BASELINE.schemaVersion, 1, '数学目录基线 schemaVersion 必须为 1');
assert.strictEqual(MATH_CURRICULUM_BASELINE.sources.length, 3, '数学目录基线必须包含三类官方来源');
assert.strictEqual(report.current.chapterCount, 29, '当前稳定数学章节必须为 29 个');
assert.strictEqual(report.current.missingStableIds.length, 0, '数学稳定章节不得缺失');
assert.ok(report.confirmedChanges.some((item) => item.id === 'math-function-split'), '缺少函数拆分差异记录');
assert.ok(report.confirmedChanges.some((item) => item.id === 'math-data-analysis-additions'), '缺少数据分析新增差异记录');
assert.ok(/^[a-f0-9]{64}$/.test(report.sourceHash), '数学目录审计 sourceHash 无效');
assert.ok(report.openQuestions.every((item) => item.status === 'needs-official-volume-map'), '开放问题不得伪装为已确认章序');

const outputPath = path.resolve(__dirname, '../dist/content-audit/math-curriculum-diff.json');
if (!fs.existsSync(outputPath)) {
  throw new Error('数学目录差异报告不存在，请先运行 node scripts/build-math-curriculum-audit.js');
}
const generatedReport = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
assert.deepStrictEqual(generatedReport, report, '已生成的数学目录差异报告与当前内容源不一致，请重新构建');

console.log(`OK math curriculum audit: ${report.current.chapterCount} stable chapters, ${report.openQuestions.length} open questions`);
