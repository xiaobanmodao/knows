const fs = require('fs');
const path = require('path');

const { checkEvidence } = require('./check-math-smartedu-catalog-evidence');
const { checkLiveReport, sha256File } = require('./math-smartedu-catalog-live');

function readJson(filePath, label) {
  const absolutePath = path.resolve(filePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(`${label}读取失败：${absolutePath}：${error.message}`);
  }
}

function main() {
  const reportPath = process.argv[2];
  const evidencePath = process.argv[3] || 'docs/evidence/math-smartedu-catalog-2026.json';
  if (!reportPath || reportPath.startsWith('--')) {
    throw new Error('用法：node scripts/check-math-smartedu-catalog-live-report.js <report.json> [evidence.json]');
  }
  const input = readJson(evidencePath, '本地证据文件');
  const report = readJson(reportPath, '在线复核报告');
  checkEvidence(input);
  checkLiveReport(input, report, { evidenceSha256: sha256File(path.resolve(evidencePath)) });
  console.log(`OK math SmartEdu live report: ${report.records.length} volumes; evidence hash matched`);
}

try {
  main();
} catch (error) {
  console.error(`FOUND_MATH_SMARTEDU_LIVE_REPORT_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
