const fs = require('fs');
const path = require('path');

const { CONTENT_SOURCE_REGISTRY } = require('../data/content-source-registry');
const { requestSourceUrl } = require('./content-source-url-access');
const { auditRegisteredSourceUrls } = require('./content-source-registry-url-access');

const DEFAULT_REPORT_PATH = 'dist/content-audit/content-source-registry-url-access.json';

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const reportPath = getOption('--report') || DEFAULT_REPORT_PATH;
  const timeoutMs = Number(getOption('--timeout-ms') || 10000);
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error('--timeout-ms 必须为正整数');
  const sources = Object.values(CONTENT_SOURCE_REGISTRY)
    .filter((source) => source.kind === 'official' || source.kind === 'reference');
  const report = await auditRegisteredSourceUrls({
    sources,
    requestUrl: (url) => requestSourceUrl(url, { timeoutMs }),
  });
  const absoluteReportPath = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
  fs.writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`${report.status.toUpperCase()} content source registry URL access`);
  console.log(`Checked: ${report.summary.checked}; passed: ${report.summary.passed}; failed: ${report.summary.failed}`);
  console.log(`Report: ${absoluteReportPath}`);
  if (process.argv.includes('--require-accessible') && report.status !== 'passed') {
    throw new Error(`内容源注册表 URL 可访问性未通过：${report.status}`);
  }
}

main().catch((error) => {
  console.error(`FOUND_CONTENT_SOURCE_REGISTRY_URL_ACCESS_ISSUE\n${error.message}`);
  process.exitCode = 1;
});
