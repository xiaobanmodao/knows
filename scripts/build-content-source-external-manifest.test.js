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
  const externalInput = filterContentSourceCatalog(catalog, {
    subjectId: 'english',
    type: 'unit',
  });
  externalInput.sourceVersion = 'external-english-units-v1';
  fs.writeFileSync(inputPath, `${JSON.stringify(externalInput, null, 2)}\n`, 'utf8');

  const manifestPath = path.join(directory, 'external-manifest.json');
  const result = buildExternalSourceManifest({
    batchId: 'english-units-v1.11',
    inputPath,
    manifestPath,
    sourceVersion: 'external-english-units-v1',
    sourceKeys: ['pep-english-new-textbook-2025'],
    sourceUrls: ['https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html'],
    reviewedAt: '2026-08-10',
    note: '契约测试外部来源凭证',
  });
  assert.strictEqual(result.manifest.sourceKind, 'external-source');
  assert.strictEqual(result.manifest.batches[0].id, 'english-units-v1.11');
  assert.strictEqual(result.manifest.batches[0].sourceKind, 'external-source');
  assert.match(result.manifest.batches[0].inputHash, /^[a-f0-9]{64}$/);
  assert.deepStrictEqual(result.manifest.batches[0].sourceEvidence, {
    sourceKeys: ['pep-english-new-textbook-2025'],
    sourceUrls: ['https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html'],
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
    /sourceEvidence|sourceUrls|来源凭证/i,
  );
  assert.throws(
    () => buildExternalSourceManifest({
      batchId: 'english-units-v1.11',
      inputPath,
      manifestPath,
      sourceVersion: 'v1.11-current',
      sourceKeys: ['current-source-version'],
      sourceUrls: ['https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html'],
      reviewedAt: '2026-08-10',
      note: '不得使用当前内容源版本',
    }),
    /当前内容源版本|sourceVersion/i,
  );
  assert.throws(
    () => buildExternalSourceManifest({
      batchId: 'english-units-v1.11',
      inputPath,
      manifestPath,
      sourceKeys: ['source-without-url'],
      sourceUrls: [],
      reviewedAt: '2026-08-10',
      note: 'missing source URL',
    }),
    /sourceUrls|来源 URL/i,
  );
  assert.throws(
    () => buildExternalSourceManifest({
      batchId: 'english-units-v1.11',
      inputPath,
      manifestPath,
      sourceKeys: ['placeholder-source'],
      sourceUrls: ['https://example.com/not-evidence'],
      reviewedAt: '2026-08-10',
      note: 'placeholder source URL',
    }),
    /占位|placeholder|source URL/i,
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
    '--source-key', 'pep-english-new-textbook-2025',
    '--source-url', 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html',
    '--reviewed-at', '2026-08-10',
    '--note', 'CLI contract evidence',
  ], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /OK external content source manifest/);
  assert.strictEqual(JSON.parse(fs.readFileSync(cliManifestPath, 'utf8')).batches[0].sourceEvidence.sourceKeys[0], 'pep-english-new-textbook-2025');

  assert.throws(
    () => buildExternalSourceManifest({
      batchId: 'english-units-v1.11',
      inputPath,
      manifestPath,
      sourceVersion: 'external-english-units-v2',
      sourceKeys: ['pep-physics-public'],
      sourceUrls: ['https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html'],
      reviewedAt: '2026-08-10',
      note: '来源键必须被输入实体引用',
    }),
    /未被输入实体引用|sourceKeys/i,
  );

  const unregisteredSourceInputPath = path.join(directory, 'english-units-unregistered-source.json');
  fs.writeFileSync(unregisteredSourceInputPath, `${JSON.stringify({
    ...externalInput,
    entities: externalInput.entities.map((entity, index) => (
      index === 0
        ? { ...entity, review: { ...entity.review, sourceKeys: ['unregistered-source-key'] } }
        : entity
    )),
    sourceVersion: 'external-english-units-unregistered-source-v1',
  }, null, 2)}\n`, 'utf8');
  assert.throws(
    () => buildExternalSourceManifest({
      batchId: 'english-units-v1.11',
      inputPath: unregisteredSourceInputPath,
      manifestPath,
      sourceVersion: 'external-english-units-unregistered-source-v1',
      sourceKeys: ['unregistered-source-key'],
      sourceUrls: ['https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html'],
      reviewedAt: '2026-08-10',
      note: '来源键必须来自注册表',
    }),
    /来源键未登记|source registry|unregistered/i,
  );
  assert.throws(
    () => buildExternalSourceManifest({
      batchId: 'english-units-v1.11',
      inputPath,
      manifestPath,
      sourceVersion: 'external-english-units-domain-mismatch-v1',
      sourceKeys: ['pep-english-new-textbook-2025'],
      sourceUrls: ['https://dictionary.cambridge.org/pronunciation/'],
      reviewedAt: '2026-08-10',
      note: '来源 URL 域名必须与来源键匹配',
    }),
    /source-evidence-url-source-mismatch|域名|mismatch/i,
  );

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
