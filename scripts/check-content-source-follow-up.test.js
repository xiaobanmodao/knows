const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { buildContentSourceCatalog, filterContentSourceCatalog } = require('./content-source-catalog');
const { normalizeBatchManifest } = require('./content-source-input-batches');
const { buildContentSourceFollowUpReport } = require('./content-source-follow-up');

const root = path.resolve(__dirname, '..');
const checker = path.join(__dirname, 'check-content-source-follow-up.js');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-source-follow-up-check-'));

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

try {
  const currentCatalog = buildContentSourceCatalog();
  const englishUnits = filterContentSourceCatalog(currentCatalog, { subjectId: 'english', type: 'unit' });
  writeJson(path.join(directory, 'english-units.json'), englishUnits);
  const manifest = {
    schemaVersion: 1,
    sourceVersion: 'follow-up-check-v1',
    sourceKind: 'current-fixture',
    batches: [{ id: 'english-units-v1.11', path: 'english-units.json' }],
  };
  const manifestPath = path.join(directory, 'manifest.json');
  const reportPath = path.join(directory, 'report.json');
  writeJson(manifestPath, manifest);
  writeJson(reportPath, buildContentSourceFollowUpReport({
    manifest: normalizeBatchManifest(manifest),
    baseDirectory: directory,
    currentCatalog,
  }));

  const validResult = spawnSync(process.execPath, [checker, manifestPath, reportPath], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.strictEqual(validResult.status, 0, validResult.stderr || validResult.stdout);
  assert.match(validResult.stdout, /OK content source follow-up report: blocked/);

  const staleReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  staleReport.summary.nextBatchId = 'stale-id';
  writeJson(reportPath, staleReport);
  const staleResult = spawnSync(process.execPath, [checker, manifestPath, reportPath], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.notStrictEqual(staleResult.status, 0);
  assert.match(`${staleResult.stdout}\n${staleResult.stderr}`, /已过期|不一致/);

  writeJson(reportPath, buildContentSourceFollowUpReport({
    manifest: normalizeBatchManifest(manifest),
    baseDirectory: directory,
    currentCatalog,
    requireExternalSource: false,
  }));
  const fixtureResult = spawnSync(process.execPath, [checker, manifestPath, reportPath, '--allow-current-fixture'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.strictEqual(fixtureResult.status, 0, fixtureResult.stderr || fixtureResult.stdout);

  const readyResult = spawnSync(process.execPath, [checker, manifestPath, reportPath, '--allow-current-fixture', '--require-ready'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.notStrictEqual(readyResult.status, 0);
  assert.match(`${readyResult.stdout}\n${readyResult.stderr}`, /尚未 ready/);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}

console.log('OK content source follow-up checker contract');
