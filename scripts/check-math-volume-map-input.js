const fs = require('fs');
const path = require('path');

const { normalizeMathVolumeMapInput } = require('./math-volume-map-input');

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath || inputPath.startsWith('--')) {
    throw new Error('用法：node scripts/check-math-volume-map-input.js <input.json> [--report <report.json>]');
  }
  const absoluteInputPath = path.resolve(inputPath);
  let input;
  try {
    input = JSON.parse(fs.readFileSync(absoluteInputPath, 'utf8'));
  } catch (error) {
    throw new Error(`数学逐册目录输入读取失败：${absoluteInputPath}：${error.message}`);
  }
  const report = normalizeMathVolumeMapInput(input);
  const reportPath = path.resolve(getOption('--report') || 'dist/content-audit/math-volume-map-input.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`OK math volume map input: ${report.entries.length} entries`);
  console.log(`Report: ${reportPath}`);
}

try {
  main();
} catch (error) {
  console.error(`FOUND_MATH_VOLUME_MAP_INPUT_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
