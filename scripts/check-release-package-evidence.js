const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const DEFAULT_REPORT = '.codex-output/release-regression-v1.10.1/packages-preview.json';

function checkPackageEvidence(filePath = DEFAULT_REPORT, { required = false } = {}) {
  const relativePath = path.relative(root, path.resolve(root, filePath));
  const absolutePath = path.resolve(root, filePath);

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
};
