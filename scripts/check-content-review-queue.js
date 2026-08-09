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
assert.strictEqual(report.totals.queued, 130, '当前应有 130 个未复核实体');
assert.strictEqual(report.items.length, 130, '复核队列条目数不正确');
assert.deepStrictEqual(report.totals.bySubject, { english: 12, math: 84, physics: 34 }, '学科队列数量不正确');
assert.ok(/^[a-f0-9]{64}$/.test(report.sourceHash), '复核队列 sourceHash 无效');

const outputPath = path.resolve(__dirname, '../dist/content-audit/content-review-queue.json');
if (!fs.existsSync(outputPath)) {
  throw new Error('复核队列报告不存在，请先运行 node scripts/build-content-review-queue.js');
}
const generatedReport = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
assert.deepStrictEqual(generatedReport, report, '已生成的复核队列与当前内容源不一致，请重新构建');

console.log(`OK content review queue: ${report.items.length} untracked entities`);
