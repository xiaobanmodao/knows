const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { buildToolStateReport } = require('./check-release-tool-state');
const { buildRoadmapStatus, buildContentSourceReadiness, formatRoadmapStatus } = require('./roadmap-status');
const { CONTENT_SOURCE_REGISTRY } = require('../data/content-source-registry');
const { hashRegistrySources } = require('./content-source-registry-url-access');

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
const readyUrlAccess = {
  schemaVersion: 1,
  status: 'passed',
  summary: { total: 2, checked: 2, passed: 2, failed: 0 },
};
const registeredSources = Object.values(CONTENT_SOURCE_REGISTRY)
  .filter((source) => source.kind === 'official' || source.kind === 'reference');
const readyRegistryUrlAccess = {
  schemaVersion: 1,
  auditKind: 'content-source-registry',
  status: 'passed',
  generatedFrom: { registryHash: hashRegistrySources(registeredSources) },
  summary: { total: 15, checked: 15, passed: 15, failed: 0 },
};

const ready = buildRoadmapStatus({
  releaseToolState: readyToolState,
  releaseToolStatePath: '/tmp/tool-state.json',
  contentSourceFollowUp: readyContentSource,
  contentSourceReportPath: '/tmp/content-source-follow-up.json',
  contentSourceUrlAccess: readyUrlAccess,
  contentSourceUrlAccessPath: '/tmp/content-source-url-access.json',
  contentSourceRegistryUrlAccess: readyRegistryUrlAccess,
  contentSourceRegistryUrlAccessPath: '/tmp/content-source-registry-url-access.json',
});
assert.strictEqual(ready.status, 'ready');
assert.deepStrictEqual(ready.blockers, []);
assert.strictEqual(ready.release.status, 'ready');
assert.strictEqual(ready.contentSource.status, 'ready');
assert.strictEqual(ready.contentSourceUrlAccess.status, 'ready');
assert.strictEqual(ready.contentSourceUrlAccess.summary.failed, 0);
assert.strictEqual(ready.contentSourceRegistryUrlAccess.status, 'ready');
assert.strictEqual(ready.contentSourceRegistryUrlAccess.summary.failed, 0);
assert.strictEqual(ready.contentSource.readiness, null);

const currentOnlyContentSource = {
  status: 'blocked',
  summary: { total: 1, ready: 0, blocked: 1, pending: 0, changed: 0, failed: 0, externalSourceMissing: 1, nextBatchId: 'math-chapters-v1.11' },
  batches: [{
    id: 'math-chapters-v1.11',
    status: 'passed',
    sourceKind: 'current-fixture',
    review: { untracked: 0 },
  }],
};
const readiness = buildContentSourceReadiness(currentOnlyContentSource);
assert.deepStrictEqual(readiness.current, { total: 1, ready: 1, pending: 0, failed: 0, status: 'ready' });
assert.deepStrictEqual(readiness.external, { total: 1, ready: 0, pending: 0, failed: 0, missing: 1, status: 'blocked' });
const splitStatus = buildRoadmapStatus({
  releaseToolState: readyToolState,
  contentSourceFollowUp: currentOnlyContentSource,
});
assert.strictEqual(splitStatus.contentSource.readiness.current.status, 'ready');
assert.strictEqual(splitStatus.contentSource.readiness.external.status, 'blocked');
assert.match(formatRoadmapStatus(splitStatus), /当前源：ready；外部资料：blocked/);

const stale = buildRoadmapStatus({
  releaseToolState: readyToolState,
  contentSourceFollowUp: readyContentSource,
  contentSourceReportFresh: false,
});
assert.strictEqual(stale.status, 'blocked');
assert.strictEqual(stale.blockers.length, 1);
assert.match(stale.blockers[0].message, /过期/);

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
    batches: [{
      id: 'english-units-v1.11',
      sourceRequirements: { note: '需要官方单元目录和来源定位' },
    }],
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
assert.ok(blocked.blockers[1].nextActions.some((item) => /需要官方单元目录和来源定位/.test(item.instruction)));

const blockedUrlAccess = buildRoadmapStatus({
  releaseToolState: readyToolState,
  contentSourceFollowUp: readyContentSource,
  contentSourceUrlAccess: {
    schemaVersion: 1,
    status: 'blocked',
    summary: { total: 2, checked: 2, passed: 1, failed: 1 },
  },
  contentSourceUrlAccessPath: '/tmp/content-source-url-access.json',
});
assert.strictEqual(blockedUrlAccess.status, 'blocked');
assert.deepStrictEqual(blockedUrlAccess.blockers.map((item) => item.id), ['content-source-url-access']);
assert.match(formatRoadmapStatus(blockedUrlAccess), /URL/);
assert.ok(blockedUrlAccess.blockers[0].nextActions.some((item) => /可访问|重新检查/.test(item.instruction)));

const staleUrlAccess = buildRoadmapStatus({
  releaseToolState: readyToolState,
  contentSourceFollowUp: readyContentSource,
  contentSourceUrlAccess: readyUrlAccess,
  contentSourceUrlAccessPath: '/tmp/content-source-url-access.json',
  contentSourceUrlAccessReportFresh: false,
});
assert.strictEqual(staleUrlAccess.status, 'blocked');
assert.deepStrictEqual(staleUrlAccess.blockers.map((item) => item.id), ['content-source-url-access']);
assert.match(staleUrlAccess.blockers[0].message, /过期/);

const staleRegistryUrlAccess = buildRoadmapStatus({
  releaseToolState: readyToolState,
  contentSourceFollowUp: readyContentSource,
  contentSourceRegistryUrlAccess: readyRegistryUrlAccess,
  contentSourceRegistryUrlAccessPath: '/tmp/content-source-registry-url-access.json',
  contentSourceRegistryUrlAccessReportFresh: false,
});
assert.strictEqual(staleRegistryUrlAccess.status, 'ready');
assert.strictEqual(staleRegistryUrlAccess.contentSourceRegistryUrlAccess.status, 'stale');
assert.strictEqual(staleRegistryUrlAccess.blockers.length, 0);
assert.match(formatRoadmapStatus(staleRegistryUrlAccess), /来源注册表 URL：stale/);

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
  const urlAccessReportPath = path.join(tempDirectory, 'content-source-url-access.json');
  const registryUrlAccessReportPath = path.join(tempDirectory, 'content-source-registry-url-access.json');
  fs.writeFileSync(toolStatePath, `${JSON.stringify(readyToolState)}\n`);
  fs.writeFileSync(contentReportPath, `${JSON.stringify(readyContentSource)}\n`);
  fs.writeFileSync(urlAccessReportPath, `${JSON.stringify(readyUrlAccess)}\n`);
  fs.writeFileSync(registryUrlAccessReportPath, `${JSON.stringify(readyRegistryUrlAccess)}\n`);
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'check-roadmap-status.js'),
    '--tool-state', toolStatePath,
    '--content-report', contentReportPath,
    '--manifest', path.join(tempDirectory, 'missing-manifest.json'),
    '--url-access-report', urlAccessReportPath,
    '--registry-url-access-report', registryUrlAccessReportPath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /OK roadmap status/);

  const releaseProject = path.join(tempDirectory, 'release-project');
  const releaseToolStatePath = path.join(releaseProject, '.codex-output/release-regression-v1.10.1/tool-state.json');
  fs.mkdirSync(path.dirname(releaseToolStatePath), { recursive: true });
  fs.writeFileSync(releaseToolStatePath, `${JSON.stringify(readyToolState)}\n`);
  const releaseProjectCli = spawnSync(process.execPath, [
    path.join(__dirname, 'check-roadmap-status.js'),
    '--release-project', releaseProject,
    '--content-report', contentReportPath,
    '--manifest', path.join(tempDirectory, 'missing-manifest.json'),
    '--registry-url-access-report', registryUrlAccessReportPath,
    '--json',
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(releaseProjectCli.status, 0, releaseProjectCli.stderr || releaseProjectCli.stdout);
  const releaseProjectReport = JSON.parse(releaseProjectCli.stdout);
  assert.strictEqual(releaseProjectReport.release.status, 'ready');
  assert.strictEqual(releaseProjectReport.release.path, releaseToolStatePath);
  assert.strictEqual(releaseProjectReport.contentSourceRegistryUrlAccess.status, 'ready');
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK roadmap status contract');
