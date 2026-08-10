const fs = require('fs');
const path = require('path');

const { checkReport } = require('./math-smartedu-edition-evidence');

function readJson(filePath, label) {
  const absolutePath = path.resolve(filePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(`${label}读取失败：${absolutePath}：${error.message}`);
  }
}

function main() {
  const reportPath = process.argv[2] || 'docs/evidence/math-smartedu-edition-evidence-2026.json';
  const evidencePath = process.argv[3] || 'docs/evidence/math-smartedu-catalog-2026.json';
  const report = readJson(reportPath, '版本预览证据报告');
  const evidence = readJson(evidencePath, '数学目录证据');
  checkReport(evidence, report);
  console.log('OK math SmartEdu edition evidence: 4 preview records; 2011 legacy signals preserved; version gate blocked');
}

try {
  main();
} catch (error) {
  console.error(`FOUND_MATH_SMARTEDU_EDITION_EVIDENCE_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
