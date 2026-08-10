const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const DEFAULT_CLI = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
const DEFAULT_OUTPUT = '.codex-output/release-regression-v1.10.1/tool-state.json';
const DEFAULT_PREVIEW_LOG = '.codex-output/release-regression-v1.10.1/preview.log';

const BLOCKER_ACTIONS = Object.freeze({
  'verify-project-config': '核对 project.config.json 中的 AppID 与开发者工具当前项目一致。',
  'login-devtools': '在微信开发者工具中登录拥有该 AppID 开发权限的账号，再重新生成状态报告。',
  'verify-appid-permission': '在微信公众平台确认当前账号拥有该 AppID 的开发权限，并确认项目成员权限未过期。',
  'reopen-project': '关闭并重新打开当前项目，确认项目绑定的 AppID 与日志中的 Using AppID 完全一致。',
  'rerun-state-diagnostic': '重新运行 check-release-tool-state.js，确认登录、AppID 和最近上传日志均已更新。',
  'preserve-preview-log': '保留完整 preview.log、错误码和 request id，不要用空报告或旧包体报告替代。',
  'inspect-upload-error': '根据日志中的错误码和 request id 排查开发者工具或微信服务端状态。',
  'retry-preview-after-fix': '仅当前置状态恢复为 ready 后，再运行 run-release-preview.js 生成当前构建包体报告。',
});

function makeBlocker(kind, message, actionIds) {
  return {
    kind,
    message,
    nextActions: actionIds.map((id) => ({ id, instruction: BLOCKER_ACTIONS[id] })),
  };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateAppId(appid) {
  if (!/^wx[a-z0-9]{16}$/i.test(String(appid || ''))) {
    throw new Error(`project.config.json: appid 不是正式小程序 AppID 格式：${appid || '(empty)'}`);
  }
  return appid;
}

function parseLoginOutput(output) {
  const text = String(output || '').trim();
  if (!text) return { status: 'unknown', loggedIn: null };

  const candidates = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reverse();
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed.login === 'boolean') {
        return {
          status: parsed.login ? 'passed' : 'blocked',
          loggedIn: parsed.login,
        };
      }
    } catch (error) {
      // DevTools may print a non-JSON status line before its JSON result.
    }
  }

  return { status: 'unknown', loggedIn: null };
}

function extractRequestIds(text) {
  const ids = [];
  const pattern = /\brid:\s*([0-9a-f-]{8,})/gi;
  let match;
  while ((match = pattern.exec(String(text || '')))) ids.push(match[1]);
  return [...new Set(ids)];
}

function analyzePreviewLog(log, expectedAppId) {
  const text = String(log || '');
  const usingAppIdMatch = text.match(/Using AppID:\s*([^\s\r\n]+)/i);
  const usingAppId = usingAppIdMatch ? usingAppIdMatch[1] : null;
  const errorMatch = text.match(/\b(410\d{2})\b/);
  const errorCode = errorMatch ? errorMatch[1] : null;
  const uploadStarted = /Uploading|上传中|上传失败/i.test(text);
  const status = errorCode === '41002'
    ? 'blocked'
    : errorCode
      ? 'failed'
      : text.trim()
        ? 'observed'
        : 'pending';

  return {
    status,
    stage: errorCode === '41002' || uploadStarted ? 'upload' : text.trim() ? 'preview' : 'unknown',
    errorCode,
    usingAppId,
    appidMatches: usingAppId ? usingAppId === expectedAppId : null,
    uploadStarted,
    requestIds: extractRequestIds(text),
  };
}

function buildToolStateReport({ projectRoot, appid, loginOutput, previewLog }) {
  let projectConfigStatus = 'passed';
  try {
    validateAppId(appid);
  } catch (error) {
    projectConfigStatus = 'failed';
  }

  const cliLogin = parseLoginOutput(loginOutput);
  const preview = analyzePreviewLog(previewLog, appid);
  const projectConfig = {
    status: projectConfigStatus,
    appid: appid || null,
  };

  let status = 'pending';
  let blocker = null;
  if (projectConfigStatus !== 'passed') {
    status = 'blocked';
    blocker = makeBlocker(
      'invalid-project-config',
      '项目配置中的 AppID 不是正式格式，无法继续判断开发者工具状态',
      ['verify-project-config'],
    );
  } else if (cliLogin.loggedIn === false) {
    status = 'blocked';
    blocker = makeBlocker(
      'cli-login-required',
      '开发者工具当前未登录，需要先完成登录',
      ['login-devtools', 'rerun-state-diagnostic'],
    );
  } else if (preview.errorCode === '41002') {
    status = 'blocked';
    blocker = makeBlocker(
      'appid-permission-or-project-binding',
      `已读取到 Using AppID，但上传阶段仍返回 41002；请确认账号拥有 ${appid} 的开发权限并重新打开项目`,
      ['verify-appid-permission', 'reopen-project', 'rerun-state-diagnostic'],
    );
  } else if (preview.status === 'failed') {
    status = 'blocked';
    blocker = makeBlocker(
      'preview-upload-failed',
      `预览日志出现错误码 ${preview.errorCode}`,
      ['preserve-preview-log', 'inspect-upload-error', 'retry-preview-after-fix'],
    );
  } else if (cliLogin.loggedIn === null || preview.status === 'pending') {
    status = 'pending';
  } else {
    status = 'ready';
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    projectRoot: projectRoot || null,
    appid: appid || null,
    status,
    blocker,
    checks: {
      projectConfig,
      cliLogin,
      preview,
    },
  };
}

function readText(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

function readProjectConfig(projectRoot) {
  const configPath = path.join(projectRoot, 'project.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return { configPath, config };
}

function runDiagnostic({
  projectRoot = root,
  cliPath = process.env.WECHAT_DEVTOOLS_CLI || DEFAULT_CLI,
  previewLogPath = path.join(projectRoot, DEFAULT_PREVIEW_LOG),
  loginOutput,
  outputPath = path.join(projectRoot, DEFAULT_OUTPUT),
} = {}) {
  const { configPath, config } = readProjectConfig(projectRoot);
  let resolvedLoginOutput = loginOutput;
  let cliError = null;
  if (resolvedLoginOutput === undefined) {
    if (!fs.existsSync(cliPath)) {
      cliError = `找不到微信开发者工具 CLI：${cliPath}`;
      resolvedLoginOutput = '';
    } else {
      const result = spawnSync(cliPath, ['islogin', '--project', projectRoot], {
        cwd: projectRoot,
        encoding: 'utf8',
      });
      resolvedLoginOutput = `${result.stdout || ''}${result.stderr || ''}`;
      if (result.error) cliError = result.error.message;
    }
  }

  const report = buildToolStateReport({
    projectRoot,
    appid: config.appid,
    loginOutput: resolvedLoginOutput,
    previewLog: readText(previewLogPath),
  });
  report.paths = {
    configPath: path.relative(projectRoot, configPath),
    previewLogPath: path.relative(projectRoot, previewLogPath),
    outputPath: path.relative(projectRoot, outputPath),
  };
  if (cliError) report.checks.cliLogin.error = cliError;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

function runCli() {
  const args = process.argv.slice(2);
  const projectArgIndex = args.indexOf('--project');
  const projectRoot = projectArgIndex >= 0 ? path.resolve(args[projectArgIndex + 1]) : root;
  const cliArgIndex = args.indexOf('--cli');
  const cliPath = cliArgIndex >= 0 ? args[cliArgIndex + 1] : undefined;
  const outputArgIndex = args.indexOf('--output');
  const outputPath = outputArgIndex >= 0
    ? path.resolve(projectRoot, args[outputArgIndex + 1])
    : undefined;
  const report = runDiagnostic({ projectRoot, cliPath, outputPath });
  console.log(`${report.status === 'blocked' ? 'BLOCKED' : 'OK'} release tool state: ${report.status}`);
  if (report.blocker) console.log(`Blocker: ${report.blocker.message}`);
  console.log(`Report: ${report.paths.outputPath}`);
  if (report.status === 'blocked') process.exitCode = 1;
}

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    console.error(`FOUND_RELEASE_TOOL_STATE_ISSUE\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  BLOCKER_ACTIONS,
  analyzePreviewLog,
  buildToolStateReport,
  parseLoginOutput,
  runDiagnostic,
  validateAppId,
};
