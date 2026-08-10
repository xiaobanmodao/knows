const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { buildCurrentSourceInputManifest } = require('./content-source-input-manifest');

const root = path.resolve(__dirname, '..');
const checker = path.join(__dirname, 'check-content-source-input-batches.js');
const builder = path.join(__dirname, 'build-content-source-input-manifest.js');
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-source-input-manifest-'));

try {
  const outputDirectory = path.join(tempDirectory, 'inputs');
  const manifestPath = path.join(tempDirectory, 'manifest.json');
  const result = buildCurrentSourceInputManifest({
    outputDirectory,
    manifestPath,
  });

  assert.strictEqual(result.manifest.schemaVersion, 1);
  assert.strictEqual(result.manifest.sourceVersion, 'v1.11-current');
  assert.strictEqual(result.manifest.sourceKind, 'current-fixture');
  assert.strictEqual(result.manifest.batches.length, 23);
  assert.strictEqual(result.files.length, 23);
  assert.strictEqual(result.manifest.batches[0].id, 'english-units-v1.11');
  assert.strictEqual(result.manifest.batches[0].path, 'inputs/english-units-v1.11.json');
  assert.strictEqual(result.manifest.batches[0].sourceKind, 'current-fixture');
  assert.match(result.manifest.batches[0].inputHash, /^[a-f0-9]{64}$/);
  assert.ok(fs.existsSync(manifestPath));
  assert.ok(fs.existsSync(path.join(outputDirectory, 'physics-knowledge-v1.11.json')));

  const firstInput = JSON.parse(fs.readFileSync(path.join(outputDirectory, 'english-units-v1.11.json'), 'utf8'));
  assert.strictEqual(firstInput.entityCount, 42);
  assert.match(firstInput.inputHash, /^[a-f0-9]{64}$/);

  const cliOutputDirectory = path.join(tempDirectory, 'cli-inputs');
  const cliManifestPath = path.join(tempDirectory, 'cli-manifest.json');
  const buildResult = spawnSync(process.execPath, [
    builder,
    '--output-dir',
    cliOutputDirectory,
    '--manifest',
    cliManifestPath,
  ], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(buildResult.status, 0, buildResult.stderr || buildResult.stdout);
  assert.ok(fs.existsSync(cliManifestPath));
  assert.ok(fs.existsSync(path.join(cliOutputDirectory, 'math-knowledge-v1.11.json')));

  const reportPath = path.join(tempDirectory, 'audit.json');
  const auditResult = spawnSync(process.execPath, [
    checker,
    manifestPath,
    '--report',
    reportPath,
    '--require-all-batches',
    '--require-no-diff',
  ], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(auditResult.status, 0, auditResult.stderr || auditResult.stdout);
  const audit = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert.strictEqual(audit.status, 'passed');
  assert.strictEqual(audit.sourceKind, 'current-fixture');
  assert.deepStrictEqual(audit.summary, {
    total: 23,
    passed: 23,
    changed: 0,
    pending: 0,
    failed: 0,
  });

  const externalManifestPath = path.join(tempDirectory, 'external-manifest.json');
  const sourceEvidence = {
    sourceKeys: ['contract-external-source'],
    sourceUrls: ['https://example.com/contract-source'],
    reviewedAt: '2026-08-10',
    note: '契约测试中的外部来源凭证',
  };
  fs.writeFileSync(externalManifestPath, `${JSON.stringify({
    ...result.manifest,
    sourceKind: 'external-source',
    batches: result.manifest.batches.map((batch) => ({
      ...batch,
      sourceKind: 'external-source',
      sourceEvidence,
    })),
  }, null, 2)}\n`, 'utf8');
  const externalAuditResult = spawnSync(process.execPath, [
    checker,
    externalManifestPath,
    '--require-all-batches',
    '--require-no-diff',
    '--require-external-source',
  ], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(externalAuditResult.status, 0, externalAuditResult.stderr || externalAuditResult.stdout);

  const fixtureStrictResult = spawnSync(process.execPath, [
    checker,
    manifestPath,
    '--require-external-source',
  ], { cwd: root, encoding: 'utf8' });
  assert.notStrictEqual(fixtureStrictResult.status, 0);
  assert.match(`${fixtureStrictResult.stderr}${fixtureStrictResult.stdout}`, /非外部批次|current-fixture/);

  const relabeledFixtureManifestPath = path.join(tempDirectory, 'relabeled-fixture-manifest.json');
  fs.writeFileSync(relabeledFixtureManifestPath, `${JSON.stringify({
    ...result.manifest,
    sourceKind: 'external-source',
  }, null, 2)}\n`, 'utf8');
  const relabeledFixtureResult = spawnSync(process.execPath, [
    checker,
    relabeledFixtureManifestPath,
    '--require-external-source',
  ], { cwd: root, encoding: 'utf8' });
  assert.notStrictEqual(relabeledFixtureResult.status, 0);
  assert.match(`${relabeledFixtureResult.stderr}${relabeledFixtureResult.stdout}`, /非外部批次|current-fixture/);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK content source input manifest contract');
