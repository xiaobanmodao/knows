const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const { scanPrivacyInterfaces } = require('./check-privacy-interfaces');

function makeFixture(relativeFile, source) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-privacy-'));
  const filePath = path.join(fixtureRoot, relativeFile);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, source, 'utf8');
  return { fixtureRoot, relativeFile };
}

function removeFixture(fixtureRoot) {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

const report = scanPrivacyInterfaces(repoRoot);
assert.strictEqual(report.status, 'passed');
assert.strictEqual(report.clipboard.readCalls, 0);
assert.strictEqual(report.clipboard.writeCalls, 8);
assert.strictEqual(report.cloud.userTraceCalls, 0);
assert.deepStrictEqual(report.cloud.userTraceFiles, {});
assert.strictEqual(report.file.calls, 2);
assert.deepStrictEqual(report.file.callsByApi, {
  'wx.chooseMessageFile': 1,
  'wx.shareFileMessage': 1,
});
assert.deepStrictEqual(report.file.callsByFile, {
  'utils/local-backup-file.js': 2,
});
assert.deepStrictEqual(report.file.allowedFiles, ['utils/local-backup-file.js']);
assert.strictEqual(report.errors.length, 0);

{
  const fixture = makeFixture('pages/clipboard.js', 'wx.getClipboardData({});');
  try {
    const fixtureReport = scanPrivacyInterfaces(fixture.fixtureRoot, { files: [fixture.relativeFile] });
    assert.ok(fixtureReport.errors.includes('clipboard-read-forbidden'));
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
}

{
  const fixture = makeFixture('pages/unregistered.js', 'wx.setClipboardData({ data: "x" });');
  try {
    const fixtureReport = scanPrivacyInterfaces(fixture.fixtureRoot, { files: [fixture.relativeFile] });
    assert.ok(fixtureReport.errors.includes('clipboard-write-file-not-registered'));
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
}

{
  const fixture = makeFixture('components/content-block/index.js', '');
  try {
    const fixtureReport = scanPrivacyInterfaces(fixture.fixtureRoot, { files: [fixture.relativeFile] });
    assert.ok(fixtureReport.errors.includes('registered-file-call-count-mismatch'));
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
}

{
  const fixture = makeFixture('pages/unregistered.js', 'wx.chooseMessageFile({});');
  try {
    const fixtureReport = scanPrivacyInterfaces(fixture.fixtureRoot, { files: [fixture.relativeFile] });
    assert.ok(fixtureReport.errors.includes('file-api-file-not-registered'));
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
}

{
  const fixture = makeFixture('utils/local-backup-file.js', '');
  try {
    const fixtureReport = scanPrivacyInterfaces(fixture.fixtureRoot, { files: [fixture.relativeFile] });
    assert.ok(fixtureReport.errors.includes('file-api-call-count-mismatch'));
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
}

{
  const fixture = makeFixture('pages/unregistered.js', 'wx.saveFile({});');
  try {
    const fixtureReport = scanPrivacyInterfaces(fixture.fixtureRoot, { files: [fixture.relativeFile] });
    assert.ok(fixtureReport.errors.includes('file-api-not-registered'));
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
}

{
  const fixture = makeFixture('app.js', 'wx.cloud.init({ env: "demo", traceUser: true });');
  try {
    const fixtureReport = scanPrivacyInterfaces(fixture.fixtureRoot, { files: [fixture.relativeFile] });
    assert.ok(fixtureReport.errors.includes('cloud-user-trace-forbidden'));
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
}

console.log('OK privacy interface contract');
