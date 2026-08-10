const fs = require('fs');
const path = require('path');

const { buildRoadmapStatus, formatRoadmapStatus } = require('./roadmap-status');
const { buildContentSourceFollowUpReport } = require('./content-source-follow-up');

const DEFAULT_TOOL_STATE_PATH = '.codex-output/release-regression-v1.10.1/tool-state.json';
const DEFAULT_CONTENT_REPORT_PATH = 'dist/content-audit/content-source-follow-up.json';
const DEFAULT_CONTENT_MANIFEST_PATH = 'dist/content-audit/content-source-input-batches/manifest.json';

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readOptionalJson(filePath, label) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${label} JSON 解析失败：${error.message}`);
  }
}

function writeReport(report, filePath) {
  const absolutePath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return absolutePath;
}

function loadContentSourceState(manifestPath, reportPath) {
  const actualReport = readOptionalJson(reportPath, '内容源跟进报告');
  const manifest = readOptionalJson(manifestPath, '内容源输入 manifest');
  if (!manifest) {
    return { report: actualReport, reportFresh: true };
  }
  const expectedReport = buildContentSourceFollowUpReport({
    manifest,
    baseDirectory: path.dirname(path.resolve(manifestPath)),
  });
  return {
    report: expectedReport,
    reportFresh: Boolean(actualReport) && JSON.stringify(actualReport) === JSON.stringify(expectedReport),
  };
}

function main() {
  const toolStatePath = getOption('--tool-state')
    || process.env.RELEASE_TOOL_STATE
    || DEFAULT_TOOL_STATE_PATH;
  const contentReportPath = getOption('--content-report')
    || process.env.CONTENT_SOURCE_FOLLOW_UP
    || DEFAULT_CONTENT_REPORT_PATH;
  const contentManifestPath = getOption('--manifest')
    || process.env.CONTENT_SOURCE_MANIFEST
    || DEFAULT_CONTENT_MANIFEST_PATH;
  const contentState = loadContentSourceState(contentManifestPath, contentReportPath);
  const report = buildRoadmapStatus({
    releaseToolState: readOptionalJson(toolStatePath, '开发者工具状态报告'),
    releaseToolStatePath: toolStatePath,
    contentSourceFollowUp: contentState.report,
    contentSourceReportPath: contentReportPath,
    contentSourceReportFresh: contentState.reportFresh,
  });
  const reportPath = getOption('--report');
  if (reportPath) console.log(`Report: ${writeReport(report, reportPath)}`);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatRoadmapStatus(report));
  }
  if (report.status !== 'ready') process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(`FOUND_ROADMAP_STATUS_ISSUE\n${error.message}`);
  process.exitCode = 1;
}
