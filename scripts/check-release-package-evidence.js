const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const DEFAULT_REPORT = '.codex-output/release-regression-v1.10.1/packages-preview.json';

function getPreviewStatusPath(reportPath = DEFAULT_REPORT) {
  return path.join(path.dirname(reportPath), 'preview-status.json');
}

function readPreviewStatus(statusPath) {
  if (!fs.existsSync(statusPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  } catch (error) {
    return { status: 'invalid', message: `状态文件不是有效 JSON：${error.message}` };
  }
}

function describePreviewStatus(status, statusPath) {
  const details = [
    status.stage && `阶段 ${status.stage}`,
    status.errorCode && `错误码 ${status.errorCode}`,
    status.message,
  ].filter(Boolean);
  const relativeStatusPath = path.relative(root, statusPath);
  return `预览状态未通过: ${status.status || 'unknown'}${details.length ? `；${details.join('；')}` : ''}（${relativeStatusPath}）`;
}

function checkPackageEvidence(filePath = DEFAULT_REPORT, { required = false } = {}) {
  const relativePath = path.relative(root, path.resolve(root, filePath));
  const absolutePath = path.resolve(root, filePath);
  const statusPath = path.resolve(root, getPreviewStatusPath(filePath));
  const previewStatus = readPreviewStatus(statusPath);

  if (previewStatus && previewStatus.status !== 'passed') {
    const message = describePreviewStatus(previewStatus, statusPath);
    if (required) throw new Error(message);
    return `PENDING release package evidence · ${message}`;
  }

  if (!fs.existsSync(absolutePath)) {
    const message = `缺少开发者工具预览包体信息: ${relativePath}`;
    if (required) {
      throw new Error(message);
    }
    return `PENDING release package evidence · ${message}`;
  }

  try {
    return execFileSync(process.execPath, [
      path.join(root, 'scripts/check-package-sizes.js'),
      absolutePath,
    ], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
  } catch (error) {
    const output = String(error.stdout || error.stderr || error.message).trim();
    throw new Error(`当前包体报告校验失败: ${output}`);
  }
}

if (require.main === module) {
  try {
    const cliArgs = process.argv.slice(2);
    const required = cliArgs.includes('--require-package-evidence');
    const reportPath = process.env.PACKAGE_SIZE_REPORT
      || cliArgs.find((arg) => !arg.startsWith('--'))
      || DEFAULT_REPORT;
    const output = checkPackageEvidence(reportPath, { required });
    console.log(`OK release package evidence checked\n${output}`);
  } catch (error) {
    console.error(`FOUND_RELEASE_PACKAGE_EVIDENCE_ISSUES\n${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  DEFAULT_REPORT,
  checkPackageEvidence,
  describePreviewStatus,
  getPreviewStatusPath,
  readPreviewStatus,
};
