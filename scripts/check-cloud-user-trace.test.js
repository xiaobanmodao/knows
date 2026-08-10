const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const { scanCloudUserTrace } = require('./check-cloud-user-trace');

function makeFixture(source) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-cloud-trace-'));
  if (source !== null) fs.writeFileSync(path.join(fixtureRoot, 'app.js'), source, 'utf8');
  return fixtureRoot;
}

function removeFixture(fixtureRoot) {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

const report = scanCloudUserTrace(repoRoot);
assert.strictEqual(report.status, 'passed');
assert.strictEqual(report.traceUserCalls, 0);
assert.deepStrictEqual(report.traceUserFiles, {});
assert.deepStrictEqual(report.errors, []);

{
  const fixtureRoot = makeFixture('wx.cloud.init({ env: "demo", traceUser: true });');
  try {
    const fixtureReport = scanCloudUserTrace(fixtureRoot);
    assert.strictEqual(fixtureReport.status, 'failed');
    assert.strictEqual(fixtureReport.traceUserCalls, 1);
    assert.deepStrictEqual(fixtureReport.traceUserFiles, { 'app.js': 1 });
    assert.ok(fixtureReport.errors.includes('cloud-user-trace-forbidden'));
  } finally {
    removeFixture(fixtureRoot);
  }
}

{
  const fixtureRoot = makeFixture('wx.cloud.init({ env: "demo", traceUser: false });');
  try {
    const fixtureReport = scanCloudUserTrace(fixtureRoot);
    assert.strictEqual(fixtureReport.status, 'passed');
    assert.strictEqual(fixtureReport.traceUserCalls, 0);
  } finally {
    removeFixture(fixtureRoot);
  }
}

{
  const fixtureRoot = makeFixture(null);
  try {
    const fixtureReport = scanCloudUserTrace(fixtureRoot);
    assert.strictEqual(fixtureReport.status, 'failed');
    assert.ok(fixtureReport.errors.includes('app-js-missing'));
  } finally {
    removeFixture(fixtureRoot);
  }
}

console.log('OK cloud user trace contract');
