const fs = require('fs');
const path = require('path');

const { buildContentSourceFollowUpReport } = require('./content-source-follow-up');

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readManifest(manifestPath) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`内容源跟进 manifest 读取失败：${error.message}`);
  }
}

function writeReport(report, reportPath) {
  const absolutePath = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return absolutePath;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath || inputPath.startsWith('--')) {
    throw new Error('用法：node scripts/build-content-source-follow-up.js <manifest.json> [--report <report.json>] [--allow-current-fixture] [--require-ready]');
  }
  const manifestPath = path.resolve(inputPath);
  const report = buildContentSourceFollowUpReport({
    manifest: readManifest(manifestPath),
    baseDirectory: path.dirname(manifestPath),
    requireExternalSource: !process.argv.includes('--allow-current-fixture'),
  });
  const reportPath = getOption('--report') || 'dist/content-audit/content-source-follow-up.json';
  const absoluteReportPath = writeReport(report, reportPath);
  console.log(`${report.status.toUpperCase()} content source follow-up`);
  console.log(`Next batch: ${report.summary.nextBatchId || '(none)'}`);
  console.log(`Report: ${absoluteReportPath}`);
  if (process.argv.includes('--require-ready') && report.status !== 'ready') {
    throw new Error(`内容源跟进尚未 ready：${report.status}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
