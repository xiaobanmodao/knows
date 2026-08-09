const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  collectContentReviewQueue,
  checkContentReviewQueue,
} = require('./content-review-queue');

const report = collectContentReviewQueue();
checkContentReviewQueue(report);

assert.strictEqual(report.schemaVersion, 1, '复核队列 schemaVersion 必须为 1');
assert.strictEqual(report.status, 'review-queue', '复核队列状态无效');
assert.strictEqual(report.totals.queued, 34, '当前应有 34 个未复核实体');
assert.strictEqual(report.items.length, 34, '复核队列条目数不正确');
assert.deepStrictEqual(report.totals.bySubject, { english: 6, math: 0, physics: 28 }, '学科队列数量不正确');
assert.strictEqual(report.totals.byType['english:topic'], undefined, '英语专题不应继续进入复核队列');
assert.strictEqual(report.totals.byType['math:chapter'], undefined, '数学章节容器不应继续进入复核队列');
assert.strictEqual(report.totals.byType['math:topic'], undefined, '数学专题容器不应继续进入复核队列');
assert.strictEqual(report.totals.byType['math:template'], undefined, '数学方法模板不应继续进入复核队列');
assert.strictEqual(report.totals.byType['physics:topic'], undefined, '物理专题不应继续进入复核队列');
assert.deepStrictEqual(report.totals.byPriority, { 2: 34 }, '复核队列优先级数量不正确');
assert.ok(/^[a-f0-9]{64}$/.test(report.sourceHash), '复核队列 sourceHash 无效');

const outputPath = path.resolve(__dirname, '../dist/content-audit/content-review-queue.json');
if (!fs.existsSync(outputPath)) {
  throw new Error('复核队列报告不存在，请先运行 node scripts/build-content-review-queue.js');
}
const generatedReport = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
assert.deepStrictEqual(generatedReport, report, '已生成的复核队列与当前内容源不一致，请重新构建');

console.log(`OK content review queue: ${report.items.length} untracked entities`);
