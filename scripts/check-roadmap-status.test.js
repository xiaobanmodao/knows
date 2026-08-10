const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { buildToolStateReport } = require('./check-release-tool-state');
const { buildRoadmapStatus, formatRoadmapStatus } = require('./roadmap-status');

const appid = 'wxb10a8a067e2709e9';
const readyToolState = buildToolStateReport({
  projectRoot: '/tmp/knows',
  appid,
  loginOutput: '{"login":true}',
  previewLog: `Using AppID: ${appid}\nUploading\nPreview completed`,
});
const readyContentSource = {
  status: 'ready',
  summary: {
    total: 23,
    ready: 23,
    blocked: 0,
    pending: 0,
    changed: 0,
    failed: 0,
    externalSourceMissing: 0,
    nextBatchId: null,
  },
};

const ready = buildRoadmapStatus({
  releaseToolState: readyToolState,
  releaseToolStatePath: '/tmp/tool-state.json',
  contentSourceFollowUp: readyContentSource,
  contentSourceReportPath: '/tmp/content-source-follow-up.json',
});
assert.strictEqual(ready.status, 'ready');
assert.deepStrictEqual(ready.blockers, []);
assert.strictEqual(ready.release.status, 'ready');
assert.strictEqual(ready.contentSource.status, 'ready');

const blockedToolState = buildToolStateReport({
  projectRoot: '/tmp/knows',
  appid,
  loginOutput: '{"login":true}',
  previewLog: `Using AppID: ${appid}\nUploading\nError 41002: appid missing`,
});
const blocked = buildRoadmapStatus({
  releaseToolState: blockedToolState,
  releaseToolStatePath: '/tmp/tool-state.json',
  contentSourceFollowUp: {
    status: 'blocked',
    summary: { total: 23, ready: 0, blocked: 23, pending: 22, changed: 0, failed: 0, nextBatchId: 'english-units-v1.11' },
  },
  contentSourceReportPath: '/tmp/content-source-follow-up.json',
});
assert.strictEqual(blocked.status, 'blocked');
assert.deepStrictEqual(blocked.blockers.map((item) => item.id), ['release-tool-state', 'content-source-follow-up']);
assert.strictEqual(blocked.blockers[0].priority, 'P0');
assert.strictEqual(blocked.blockers[1].priority, 'P1');
assert.ok(blocked.blockers[0].nextActions.some((item) => /权限/.test(item.instruction)));
assert.match(formatRoadmapStatus(blocked), /41002/);
assert.match(formatRoadmapStatus(blocked), /english-units-v1\.11/);

const missing = buildRoadmapStatus({
  releaseToolStatePath: '/tmp/missing-tool-state.json',
  contentSourceReportPath: '/tmp/missing-content-source-follow-up.json',
});
assert.strictEqual(missing.status, 'blocked');
assert.deepStrictEqual(missing.blockers.map((item) => item.id), ['release-tool-state', 'content-source-follow-up']);
assert.ok(missing.blockers.every((item) => item.message));

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-roadmap-status-'));
try {
  const toolStatePath = path.join(tempDirectory, 'tool-state.json');
  const contentReportPath = path.join(tempDirectory, 'content-source-follow-up.json');
  fs.writeFileSync(toolStatePath, `${JSON.stringify(readyToolState)}\n`);
  fs.writeFileSync(contentReportPath, `${JSON.stringify(readyContentSource)}\n`);
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'check-roadmap-status.js'),
    '--tool-state', toolStatePath,
    '--content-report', contentReportPath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /OK roadmap status/);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK roadmap status contract');
