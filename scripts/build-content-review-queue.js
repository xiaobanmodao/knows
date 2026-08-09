const fs = require('fs');
const path = require('path');

const {
  collectContentReviewQueue,
  checkContentReviewQueue,
} = require('./content-review-queue');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'dist/content-audit/content-review-queue.json');
const report = collectContentReviewQueue();
checkContentReviewQueue(report);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`OK wrote ${path.relative(root, outputPath)} (${report.totals.queued} queued entities)`);
