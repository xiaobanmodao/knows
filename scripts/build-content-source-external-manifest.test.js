const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { buildContentSourceCatalog, filterContentSourceCatalog } = require('./content-source-catalog');
const { buildExternalSourceManifest } = require('./build-content-source-external-manifest');
const {
  buildContentSourceInputBatchAudit,
  normalizeBatchManifest,
} = require('./content-source-input-batches');

const root = path.resolve(__dirname, '..');
const builder = path.join(__dirname, 'build-content-source-external-manifest.js');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-external-manifest-'));

try {
  const catalog = buildContentSourceCatalog();
  const inputPath = path.join(directory, 'english-units.json');
  fs.writeFileSync(inputPath, `${JSON.stringify(filterContentSourceCatalog(catalog, {
    subjectId: 'english',
    type: 'unit',
  }), null, 2)}\n`, 'utf8');

  const manifestPath = path.join(directory, 'external-manifest.json');
  const result = buildExternalSourceManifest({
    batchId: 'english-units-v1.11',
    inputPath,
    manifestPath,
    sourceVersion: 'external-english-units-v1',
    sourceKeys: ['pep-english-external-contract'],
    sourceUrls: ['https://example.com/english-units'],
    reviewedAt: '2026-08-10',
    note: '契约测试外部来源凭证',
  });
  assert.strictEqual(result.manifest.sourceKind, 'external-source');
  assert.strictEqual(result.manifest.batches[0].id, 'english-units-v1.11');
  assert.strictEqual(result.manifest.batches[0].sourceKind, 'external-source');
  assert.match(result.manifest.batches[0].inputHash, /^[a-f0-9]{64}$/);
  assert.deepStrictEqual(result.manifest.batches[0].sourceEvidence, {
    sourceKeys: ['pep-english-external-contract'],
    sourceUrls: ['https://example.com/english-units'],
    reviewedAt: '2026-08-10',
    note: '契约测试外部来源凭证',
  });
  assert.strictEqual(result.manifest.batches[0].path, 'english-units.json');
  assert.ok(fs.existsSync(manifestPath));

  assert.throws(
    () => normalizeBatchManifest({
      ...result.manifest,
      batches: [{ ...result.manifest.batches[0], inputHash: 'invalid-hash' }],
    }),
    /inputHash|哈希/i,
  );

  assert.throws(
    () => buildExternalSourceManifest({
      batchId: 'english-units-v1.11',
      inputPath,
      manifestPath,
      sourceKeys: [],
      reviewedAt: '2026-08-10',
      note: 'missing source key',
    }),
    /sourceEvidence|来源凭证/i,
  );
  assert.throws(
    () => buildExternalSourceManifest({
      batchId: 'english-units-v1.11',
      inputPath,
      manifestPath: inputPath,
      sourceKeys: ['same-file'],
      reviewedAt: '2026-08-10',
      note: 'same file must fail',
    }),
    /不能覆盖输入文件|same/i,
  );

  const cliManifestPath = path.join(directory, 'cli-external-manifest.json');
  const cli = spawnSync(process.execPath, [
    builder,
    '--batch', 'english-units-v1.11',
    '--input', inputPath,
    '--manifest', cliManifestPath,
    '--source-key', 'pep-english-external-cli',
    '--source-url', 'https://example.com/english-cli',
    '--reviewed-at', '2026-08-10',
    '--note', 'CLI contract evidence',
  ], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /OK external content source manifest/);
  assert.strictEqual(JSON.parse(fs.readFileSync(cliManifestPath, 'utf8')).batches[0].sourceEvidence.sourceKeys[0], 'pep-english-external-cli');

  const originalInput = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  fs.writeFileSync(inputPath, `${JSON.stringify({
    ...originalInput,
    entities: originalInput.entities.map((entity, index) => (
      index === 0 ? { ...entity, title: `${entity.title}（文件被替换）` } : entity
    )),
  }, null, 2)}\n`, 'utf8');
  const staleAudit = buildContentSourceInputBatchAudit({
    manifest: normalizeBatchManifest(result.manifest),
    baseDirectory: directory,
    currentCatalog: catalog,
  });
  assert.strictEqual(staleAudit.status, 'failed');
  assert.strictEqual(staleAudit.batches[0].reason, 'manifest-input-hash-mismatch');
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}

console.log('OK external content source manifest contract');
