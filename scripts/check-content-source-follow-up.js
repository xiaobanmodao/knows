const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { buildContentSourceFollowUpReport } = require('./content-source-follow-up');

function readJson(filePath, label) {
  const absolutePath = path.resolve(filePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(`${label} 读取失败：${error.message}`);
  }
}

function main() {
  const manifestPath = process.argv[2];
  const reportPath = process.argv[3];
  if (!manifestPath || !reportPath || manifestPath.startsWith('--') || reportPath.startsWith('--')) {
    throw new Error('用法：node scripts/check-content-source-follow-up.js <manifest.json> <report.json> [--allow-current-fixture] [--require-ready]');
  }

  const absoluteManifestPath = path.resolve(manifestPath);
  const actual = readJson(reportPath, '内容源跟进报告');
  const expected = buildContentSourceFollowUpReport({
    manifest: readJson(absoluteManifestPath, '内容源 manifest'),
    baseDirectory: path.dirname(absoluteManifestPath),
    requireExternalSource: !process.argv.includes('--allow-current-fixture'),
  });
  assert.deepStrictEqual(actual, expected, '内容源跟进报告已过期或与当前 manifest/内容源不一致');

  if (process.argv.includes('--require-ready')) {
    assert.strictEqual(actual.status, 'ready', `内容源跟进报告尚未 ready：${actual.status}`);
  }
  console.log(`OK content source follow-up report: ${actual.status}; next ${actual.summary.nextBatchId || '(none)'}`);
}

try {
  main();
} catch (error) {
  console.error(`FOUND_CONTENT_SOURCE_FOLLOW_UP_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
