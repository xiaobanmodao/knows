const assert = require('assert');

const {
  analyzePreviewLog,
  buildToolStateReport,
  parseLoginOutput,
  validateAppId,
} = require('./check-release-tool-state');

const appid = 'wxb10a8a067e2709e9';

assert.strictEqual(validateAppId(appid), appid);
assert.throws(() => validateAppId('touristappid'), /正式小程序 AppID/);

assert.deepStrictEqual(parseLoginOutput('{"login":true}\n'), {
  status: 'passed',
  loggedIn: true,
});
assert.deepStrictEqual(parseLoginOutput('{"login":false}\n'), {
  status: 'blocked',
  loggedIn: false,
});
assert.deepStrictEqual(parseLoginOutput('not-json'), {
  status: 'unknown',
  loggedIn: null,
});

const blockedLog = [
  'Fetching AppID (wxb10a8a067e2709e9) permissions',
  'Using AppID: wxb10a8a067e2709e9',
  'Preview',
  'Uploading',
  'Error 41002: appid missing rid: 18bc63da-1786322634',
].join('\n');

assert.deepStrictEqual(analyzePreviewLog(blockedLog, appid), {
  status: 'blocked',
  stage: 'upload',
  errorCode: '41002',
  usingAppId: appid,
  appidMatches: true,
  uploadStarted: true,
  requestIds: ['18bc63da-1786322634'],
});

assert.deepStrictEqual(analyzePreviewLog('', appid), {
  status: 'pending',
  stage: 'unknown',
  errorCode: null,
  usingAppId: null,
  appidMatches: null,
  uploadStarted: false,
  requestIds: [],
});

const report = buildToolStateReport({
  projectRoot: '/tmp/knows',
  appid,
  loginOutput: '{"login":true}',
  previewLog: blockedLog,
});

assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.status, 'blocked');
assert.strictEqual(report.blocker.kind, 'appid-permission-or-project-binding');
assert.strictEqual(report.checks.projectConfig.status, 'passed');
assert.strictEqual(report.checks.cliLogin.status, 'passed');
assert.strictEqual(report.checks.preview.status, 'blocked');
assert.deepStrictEqual(report.checks.preview.requestIds, ['18bc63da-1786322634']);

const pendingReport = buildToolStateReport({
  projectRoot: '/tmp/knows',
  appid,
  loginOutput: '{"login":true}',
  previewLog: '',
});
assert.strictEqual(pendingReport.status, 'pending');
assert.strictEqual(pendingReport.blocker, null);

console.log('OK release tool state contract');
