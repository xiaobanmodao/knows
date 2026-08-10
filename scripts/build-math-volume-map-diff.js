const fs = require('fs');
const path = require('path');

const { buildMathVolumeMapDiff } = require('./math-volume-map-diff');

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath || inputPath.startsWith('--')) {
    throw new Error('用法：node scripts/build-math-volume-map-diff.js <official-volume-map.json> [--report <report.json>]');
  }
  let input;
  try {
    input = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  } catch (error) {
    throw new Error(`数学逐册目录输入读取失败：${error.message}`);
  }
  const report = buildMathVolumeMapDiff(input);
  const reportPath = path.resolve(getOption('--report') || 'dist/content-audit/math-volume-map-diff.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`OK math volume map diff: ${report.summary.totalEntries} entries, ${report.summary.entriesWithDifferences} with differences`);
  console.log(`Report: ${reportPath}`);
}

try {
  main();
} catch (error) {
  console.error(`FOUND_MATH_VOLUME_MAP_DIFF_ISSUE ${error.message}`);
  process.exitCode = 1;
}
