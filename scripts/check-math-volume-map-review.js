const fs = require('fs');
const path = require('path');

const { normalizeMathVolumeMapReview } = require('./math-volume-map-review');

function readJson(inputPath, label) {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  } catch (error) {
    throw new Error(`${label}读取失败：${error.message}`);
  }
}

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const diffPath = process.argv[2];
  const reviewPath = process.argv[3];
  if (!diffPath || !reviewPath || diffPath.startsWith('--') || reviewPath.startsWith('--')) {
    throw new Error('用法：node scripts/check-math-volume-map-review.js <diff-report.json> <review.json> [--report <report.json>]');
  }
  const report = normalizeMathVolumeMapReview({
    diffReport: readJson(diffPath, '数学目录差异报告'),
    review: readJson(reviewPath, '数学目录人工确认'),
  });
  const reportPath = path.resolve(getOption('--report') || 'dist/content-audit/math-volume-map-review.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`OK math volume map review: ${report.status}, ${report.entries.length} entries`);
  console.log(`Report: ${reportPath}`);
}

try {
  main();
} catch (error) {
  console.error(`FOUND_MATH_VOLUME_MAP_REVIEW_ISSUE ${error.message}`);
  process.exitCode = 1;
}
