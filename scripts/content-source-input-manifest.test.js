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
  assert.strictEqual(result.manifest.batches.length, 23);
  assert.strictEqual(result.files.length, 23);
  assert.strictEqual(result.manifest.batches[0].id, 'english-units-v1.11');
  assert.strictEqual(result.manifest.batches[0].path, 'inputs/english-units-v1.11.json');
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
  assert.deepStrictEqual(audit.summary, {
    total: 23,
    passed: 23,
    changed: 0,
    pending: 0,
    failed: 0,
  });
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK content source input manifest contract');
