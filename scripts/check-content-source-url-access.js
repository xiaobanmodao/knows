const fs = require('fs');
const path = require('path');

const {
  auditSourceUrls,
  requestSourceUrl,
} = require('./content-source-url-access');

const DEFAULT_REPORT_PATH = 'dist/content-audit/content-source-url-access.json';

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`内容源 manifest 读取失败：${filePath}：${error.message}`);
  }
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath || manifestPath.startsWith('--')) {
    throw new Error('用法：node scripts/check-content-source-url-access.js <manifest.json> [--report <report.json>] [--timeout-ms <ms>] [--require-accessible]');
  }
  const reportPath = getOption('--report') || DEFAULT_REPORT_PATH;
  const timeoutMs = Number(getOption('--timeout-ms') || 10000);
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error('--timeout-ms 必须为正整数');
  const report = await auditSourceUrls({
    manifest: readJson(manifestPath),
    requestUrl: (url) => requestSourceUrl(url, { timeoutMs }),
  });
  const absoluteReportPath = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
  fs.writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`${report.status.toUpperCase()} content source URL access`);
  console.log(`Checked: ${report.summary.checked}; passed: ${report.summary.passed}; failed: ${report.summary.failed}`);
  console.log(`Report: ${absoluteReportPath}`);
  if (process.argv.includes('--require-accessible') && report.status !== 'passed') {
    throw new Error(`内容源 URL 可访问性未通过：${report.status}`);
  }
}

main().catch((error) => {
  console.error(`FOUND_CONTENT_SOURCE_URL_ACCESS_ISSUE\n${error.message}`);
  process.exitCode = 1;
});
