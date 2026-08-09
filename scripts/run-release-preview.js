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

function extractPreviewErrorCode(output) {
  const match = String(output || '').match(/\b(410\d{2})\b/);
  return match ? match[1] : null;
}

function buildPreviewStatus({
  status,
  stage,
  appid,
  startedAt,
  finishedAt,
  exitCode,
  errorCode,
  message,
  paths,
}) {
  return {
    schemaVersion: 1,
    status,
    stage,
    appid,
    startedAt,
    finishedAt,
    exitCode: Number.isInteger(exitCode) ? exitCode : null,
    errorCode: errorCode || null,
    message: message || '',
    paths: {
      logPath: paths && paths.logPath,
      reportPath: paths && paths.reportPath,
      qrPath: paths && paths.qrPath,
    },
  };
}

function inferPreviewStage(output, fallback = 'preview') {
  if (/410\d{2}|Uploading|上传失败/i.test(String(output || ''))) return 'upload';
  if (/size\.packages|包体报告|info-output/i.test(String(output || ''))) return 'report';
  return fallback;
}

function runPreview({ cliPath = process.env.WECHAT_DEVTOOLS_CLI || DEFAULT_CLI } = {}) {
  const config = readProjectConfig();
  const appid = validateAppId(config.appid);
  const outputDir = path.resolve(root, process.env.RELEASE_PREVIEW_OUTPUT || DEFAULT_OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });
  const statusPath = path.join(outputDir, 'preview-status.json');
  const startedAt = new Date().toISOString();

  const preview = buildPreviewArgs({ projectRoot: root, appid, outputDir });
  const paths = {
    logPath: path.relative(root, path.join(outputDir, 'preview.log')),
    reportPath: path.relative(root, preview.reportPath),
    qrPath: path.relative(root, preview.qrPath),
  };
  const writeStatus = ({ status, stage, exitCode = null, errorCode = null, message = '' }) => {
    fs.writeFileSync(statusPath, `${JSON.stringify(buildPreviewStatus({
      status,
      stage,
      appid,
      startedAt,
      finishedAt: new Date().toISOString(),
      exitCode,
      errorCode,
      message,
      paths,
    }), null, 2)}\n`, 'utf8');
  };
  const fail = ({ stage, exitCode = null, errorCode = null, message }) => {
    writeStatus({ status: 'blocked', stage, exitCode, errorCode, message });
    throw new Error(`${message}；完整日志：${paths.logPath}；状态记录：${path.relative(root, statusPath)}`);
  };

  if (!fs.existsSync(cliPath)) {
    fail({ stage: 'preflight', message: `找不到微信开发者工具 CLI：${cliPath}` });
  }

  const result = spawnSync(cliPath, preview.args, {
    cwd: root,
    encoding: 'utf8',
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const logPath = path.join(outputDir, 'preview.log');
  fs.writeFileSync(logPath, output, 'utf8');

  if (result.error) {
    fail({ stage: 'launch', exitCode: result.status, errorCode: extractPreviewErrorCode(output), message: result.error.message });
  }
  const errorCode = extractPreviewErrorCode(output);
  if (errorCode === '41002') {
    fail({
      stage: 'upload',
      exitCode: result.status,
      errorCode,
      message: `开发者工具上传仍返回 41002 appid missing，请确认当前账号拥有 ${appid} 的开发权限并重新打开项目`,
    });
  }
  if (result.status !== 0) {
    fail({
      stage: inferPreviewStage(output),
      exitCode: result.status,
      errorCode,
      message: `开发者工具预览失败（退出码 ${result.status}）`,
    });
  }
  if (!fs.existsSync(preview.reportPath) || fs.statSync(preview.reportPath).size === 0) {
    fail({
      stage: 'report',
      exitCode: result.status,
      errorCode,
      message: `预览未生成有效包体报告：${paths.reportPath}`,
    });
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(preview.reportPath, 'utf8'));
  } catch (error) {
    fail({
      stage: 'report',
      exitCode: result.status,
      errorCode,
      message: `包体报告不是有效 JSON：${paths.reportPath}（${error.message}）`,
    });
  }
  if (!report.size || !Array.isArray(report.size.packages)) {
    fail({
      stage: 'report',
      exitCode: result.status,
      errorCode,
      message: `包体报告缺少 size.packages：${paths.reportPath}`,
    });
  }
  writeStatus({
    status: 'passed',
    stage: 'report',
    exitCode: result.status,
    message: '预览包体报告已生成并通过结构检查',
  });
  console.log(`OK release preview report: ${path.relative(root, preview.reportPath)}`);
  console.log(`Status: ${path.relative(root, statusPath)}`);
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
  extractPreviewErrorCode,
  buildPreviewStatus,
};
