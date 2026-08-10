const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { buildContentSourceCatalog, filterContentSourceCatalog } = require('./content-source-catalog');
const { normalizeBatchManifest } = require('./content-source-input-batches');
const { buildContentSourceFollowUpReport } = require('./content-source-follow-up');

const root = path.resolve(__dirname, '..');
const builder = path.join(__dirname, 'build-content-source-follow-up.js');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-source-follow-up-'));

try {
  const currentCatalog = buildContentSourceCatalog();
  const englishUnits = filterContentSourceCatalog(currentCatalog, { subjectId: 'english', type: 'unit' });
  fs.writeFileSync(path.join(directory, 'english-units.json'), `${JSON.stringify(englishUnits, null, 2)}\n`, 'utf8');
  const manifest = {
    schemaVersion: 1,
    sourceVersion: 'follow-up-fixture-v1',
    sourceKind: 'current-fixture',
    batches: [{ id: 'english-units-v1.11', path: 'english-units.json' }],
  };
  const report = buildContentSourceFollowUpReport({
    manifest: normalizeBatchManifest(manifest),
    baseDirectory: directory,
    currentCatalog,
  });
  assert.strictEqual(report.status, 'blocked');
  assert.strictEqual(report.summary.total, 23);
  assert.strictEqual(report.summary.ready, 0);
  assert.strictEqual(report.summary.blocked, 23);
  assert.strictEqual(report.summary.externalSourceMissing, 23);
  assert.strictEqual(report.summary.nextBatchId, 'math-chapters-v1.11');
  const englishUnitsBatch = report.batches.find((batch) => batch.id === 'english-units-v1.11');
  assert.strictEqual(englishUnitsBatch.action, 'provide-external-source');
  assert.strictEqual(englishUnitsBatch.status, 'passed');
  assert.strictEqual(englishUnitsBatch.priority, 'P1');
  assert.strictEqual(englishUnitsBatch.counts.entities, 42);
  const englishWordsBatch = report.batches.find((batch) => batch.id === 'english-words-v1.11');
  assert.strictEqual(englishWordsBatch.reason, 'manifest-missing');

  const allowFixtureReport = buildContentSourceFollowUpReport({
    manifest: normalizeBatchManifest(manifest),
    baseDirectory: directory,
    currentCatalog,
    requireExternalSource: false,
  });
  assert.strictEqual(allowFixtureReport.status, 'needs-review');
  assert.strictEqual(allowFixtureReport.summary.externalSourceMissing, 0);
  assert.strictEqual(allowFixtureReport.summary.ready, 1);
  assert.strictEqual(allowFixtureReport.batches.find((batch) => batch.id === 'english-units-v1.11').action, 'no-action');
  assert.strictEqual(allowFixtureReport.batches.find((batch) => batch.id === 'english-units-v1.11').status, 'passed');

  const manifestPath = path.join(directory, 'manifest.json');
  const reportPath = path.join(directory, 'follow-up.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const cli = spawnSync(process.execPath, [builder, manifestPath, '--report', reportPath], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /BLOCKED content source follow-up/);
  assert.strictEqual(JSON.parse(fs.readFileSync(reportPath, 'utf8')).summary.nextBatchId, 'math-chapters-v1.11');

  const strictCli = spawnSync(process.execPath, [builder, manifestPath, '--require-ready'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.notStrictEqual(strictCli.status, 0);
  assert.match(`${strictCli.stdout}\n${strictCli.stderr}`, /尚未 ready/);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}

console.log('OK content source follow-up contract');
