const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { buildToolStateReport } = require('./check-release-tool-state');
const { validateReleaseToolStateEvidence } = require('./release-tool-state-evidence');

const appid = 'wxb10a8a067e2709e9';
const ready = buildToolStateReport({
  projectRoot: '/tmp/knows',
  appid,
  loginOutput: '{"login":true}',
  previewLog: `Using AppID: ${appid}\nUploading\nPreview completed`,
});
assert.deepStrictEqual(validateReleaseToolStateEvidence(ready), { valid: true, issues: [] });

const blocked = buildToolStateReport({
  projectRoot: '/tmp/knows',
  appid,
  loginOutput: '{"login":true}',
  previewLog: `Using AppID: ${appid}\nUploading\nError 41002: appid missing`,
});
const blockedCheck = validateReleaseToolStateEvidence(blocked);
assert.strictEqual(blockedCheck.valid, false);
assert.ok(blockedCheck.issues.some((issue) => /41002|blocked/.test(issue)));

const mismatched = buildToolStateReport({
  projectRoot: '/tmp/knows',
  appid,
  loginOutput: '{"login":true}',
  previewLog: 'Using AppID: wx0000000000000000\nUploading\nPreview completed',
});
const mismatchedCheck = validateReleaseToolStateEvidence(mismatched);
assert.strictEqual(mismatchedCheck.valid, false);
assert.ok(mismatchedCheck.issues.some((issue) => /不一致/.test(issue)));

assert.strictEqual(validateReleaseToolStateEvidence(null).valid, false);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-tool-state-'));
const absoluteStatePath = path.join(tempDir, 'tool-state.json');
fs.writeFileSync(absoluteStatePath, JSON.stringify(blocked, null, 2));
try {
  execFileSync(process.execPath, [path.join(__dirname, 'check-release-readiness.js'), '--require-device-evidence'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, RELEASE_TOOL_STATE: absoluteStatePath },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.fail('strict readiness should reject the blocked tool state');
} catch (error) {
  const output = `${error.stdout || ''}${error.stderr || ''}`;
  assert.ok(output.includes('开发者工具状态报告: 开发者工具状态必须为 ready，当前为 blocked'));
  assert.ok(!output.includes(`开发者工具状态报告: 文件不存在 -> ${absoluteStatePath}`));
}
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('OK release tool state evidence contract');
