const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  buildContentSourceInputBatchAudit,
  normalizeBatchManifest,
} = require('./content-source-input-batches');

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readManifest(manifestPath) {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`内容源输入批次 manifest 读取失败：${error.message}`);
  }
  return normalizeBatchManifest(input);
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
    throw new Error('用法：node scripts/check-content-source-input-batches.js <manifest.json> [--report <report.json>] [--require-all-batches] [--require-no-diff]');
  }
  const manifestPath = path.resolve(inputPath);
  const manifest = readManifest(manifestPath);
  const report = buildContentSourceInputBatchAudit({
    manifest,
    baseDirectory: path.dirname(manifestPath),
    requireAllBatches: process.argv.includes('--require-all-batches'),
  });
  const reportPath = getOption('--report');
  if (reportPath) console.log(`Report: ${writeReport(report, reportPath)}`);

  report.batches.forEach((batch) => {
    const suffix = batch.diff
      ? `, diff +${batch.diff.added} ~${batch.diff.modified} -${batch.diff.removed}`
      : `, reason ${batch.reason}`;
    console.log(`${batch.status.toUpperCase()} content source input batch ${batch.id}${suffix}`);
  });
  console.log(`Status: ${report.status}; batches ${report.summary.passed}/${report.summary.total} passed`);

  if (process.argv.includes('--require-all-batches')) {
    assert.strictEqual(report.status, 'passed', '内容源输入 manifest 未完整通过');
  }
  if (process.argv.includes('--require-no-diff')) {
    assert.strictEqual(report.status, 'passed', '外部内容源输入存在差异或未完成');
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
