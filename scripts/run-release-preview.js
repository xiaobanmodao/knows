const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_DIR = '.codex-output/release-regression-v1.10.1';
const DEFAULT_CLI = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';

function readProjectConfig(configPath = path.join(root, 'project.config.json')) {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function validateAppId(appid) {
  if (!/^wx[a-z0-9]{16}$/i.test(String(appid || ''))) {
    throw new Error(`project.config.json: appid 不是正式小程序 AppID 格式：${appid || '(empty)'}`);
  }
  return appid;
}

function buildPreviewArgs({ projectRoot, appid, outputDir }) {
  const qrPath = path.join(outputDir, 'preview-qr.png');
  const reportPath = path.join(outputDir, 'packages-preview.json');
  return {
    qrPath,
    reportPath,
    args: [
      'preview',
      '--project', projectRoot,
      '--appid', appid,
      '--qr-format', 'image',
      '--qr-output', qrPath,
      '--info-output', reportPath,
    ],
  };
}

function runPreview({ cliPath = process.env.WECHAT_DEVTOOLS_CLI || DEFAULT_CLI } = {}) {
  const config = readProjectConfig();
  const appid = validateAppId(config.appid);
  const outputDir = path.resolve(root, process.env.RELEASE_PREVIEW_OUTPUT || DEFAULT_OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  if (!fs.existsSync(cliPath)) {
    throw new Error(`找不到微信开发者工具 CLI：${cliPath}`);
  }

  const preview = buildPreviewArgs({ projectRoot: root, appid, outputDir });
  const result = spawnSync(cliPath, preview.args, {
    cwd: root,
    encoding: 'utf8',
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const logPath = path.join(outputDir, 'preview.log');
  fs.writeFileSync(logPath, output, 'utf8');

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`开发者工具预览失败（退出码 ${result.status}），完整日志：${logPath}`);
  }
  if (/41002\s+appid missing/i.test(output)) {
    throw new Error(`开发者工具上传仍返回 41002 appid missing，请确认当前账号拥有 ${appid} 的开发权限并重新打开项目；完整日志：${logPath}`);
  }
  if (!fs.existsSync(preview.reportPath) || fs.statSync(preview.reportPath).size === 0) {
    throw new Error(`预览未生成有效包体报告：${preview.reportPath}；完整日志：${logPath}`);
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(preview.reportPath, 'utf8'));
  } catch (error) {
    throw new Error(`包体报告不是有效 JSON：${preview.reportPath}（${error.message}）`);
  }
  if (!report.size || !Array.isArray(report.size.packages)) {
    throw new Error(`包体报告缺少 size.packages：${preview.reportPath}`);
  }
  console.log(`OK release preview report: ${path.relative(root, preview.reportPath)}`);
  console.log(`Log: ${path.relative(root, logPath)}`);
  return preview.reportPath;
}

if (require.main === module) {
  try {
    runPreview();
  } catch (error) {
    console.error(`FOUND_RELEASE_PREVIEW_ISSUE\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  buildPreviewArgs,
  validateAppId,
};
