const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  buildContentSourceCatalog,
  filterContentSourceCatalog,
} = require('./content-source-catalog');
const {
  buildContentSourceInputBatchAudit,
  normalizeBatchManifest,
} = require('./content-source-input-batches');

const source = buildContentSourceCatalog();
const root = path.resolve(__dirname, '..');
const checker = path.join(__dirname, 'check-content-source-input-batches.js');
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-source-input-batches-'));

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

try {
  const englishUnits = filterContentSourceCatalog(source, {
    subjectId: 'english',
    type: 'unit',
  });
  const inputPath = path.join(tempDirectory, 'english-units.json');
  fs.writeFileSync(inputPath, `${JSON.stringify(englishUnits, null, 2)}\n`, 'utf8');

  const manifest = normalizeBatchManifest({
    schemaVersion: 1,
    sourceVersion: 'external-fixture-v1',
    sourceKind: 'external-source',
    batches: [
      { id: 'english-units-v1.11', path: 'english-units.json' },
      { id: 'english-words-v1.11', path: 'english-words.json' },
    ],
  });
  const report = buildContentSourceInputBatchAudit({
    manifest,
    baseDirectory: tempDirectory,
    currentCatalog: source,
  });

  assert.strictEqual(report.schemaVersion, 1);
  assert.strictEqual(report.status, 'pending');
  assert.deepStrictEqual(report.summary, {
    total: 2,
    passed: 1,
    changed: 0,
    pending: 1,
    failed: 0,
  });
  assert.strictEqual(report.batches[0].status, 'passed');
  assert.strictEqual(report.batches[0].counts.entities, 42);
  assert.deepStrictEqual(report.batches[0].diff, { added: 0, modified: 0, removed: 0 });
  assert.strictEqual(report.batches[1].status, 'pending');
  assert.strictEqual(report.batches[1].reason, 'file-not-found');

  const csvPath = path.join(tempDirectory, 'english-units.csv');
  const headers = [
    'key', 'subjectId', 'type', 'id', 'title', 'parentId', 'reviewStatus',
    'reviewedAt', 'sourceKeys', 'contentHash', 'exampleCount', 'experimentCount', 'assetCount',
  ];
  const csvRows = englishUnits.entities.map((entity) => [
    entity.key,
    entity.subjectId,
    entity.type,
    entity.id,
    entity.title,
    entity.parentId,
    entity.review.status,
    entity.review.reviewedAt,
    entity.review.sourceKeys.join('|'),
    entity.contentHash,
    entity.exampleCount,
    entity.experimentCount,
    entity.assetCount,
  ].map(csvCell).join(','));
  fs.writeFileSync(csvPath, [headers.join(','), ...csvRows].join('\n'), 'utf8');
  const csvReport = buildContentSourceInputBatchAudit({
    manifest: normalizeBatchManifest({
      schemaVersion: 1,
      sourceVersion: 'external-csv-fixture-v1',
      sourceKind: 'external-source',
      batches: [{ id: 'english-units-v1.11', path: 'english-units.csv' }],
    }),
    baseDirectory: tempDirectory,
    currentCatalog: source,
  });
  assert.strictEqual(csvReport.status, 'passed');
  assert.strictEqual(csvReport.batches[0].inputSourceVersion, 'external-csv-fixture-v1');

  const manifestPath = path.join(tempDirectory, 'manifest.json');
  const reportPath = path.join(tempDirectory, 'manifest-report.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const cliResult = spawnSync(process.execPath, [
    checker,
    manifestPath,
    '--report',
    reportPath,
  ], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(cliResult.status, 0, cliResult.stderr || cliResult.stdout);
  assert.strictEqual(JSON.parse(fs.readFileSync(reportPath, 'utf8')).status, 'pending');

  const strictCliResult = spawnSync(process.execPath, [
    checker,
    manifestPath,
    '--require-all-batches',
  ], { cwd: root, encoding: 'utf8' });
  assert.notStrictEqual(strictCliResult.status, 0);

  const currentFixtureManifest = {
    schemaVersion: 1,
    sourceVersion: 'current-fixture-v1',
    sourceKind: 'current-fixture',
    batches: [{ id: 'english-units-v1.11', path: 'english-units.json' }],
  };
  const externalGateReport = buildContentSourceInputBatchAudit({
    manifest: normalizeBatchManifest(currentFixtureManifest),
    baseDirectory: tempDirectory,
    currentCatalog: source,
    requireExternalSource: true,
  });
  assert.strictEqual(externalGateReport.status, 'blocked');
  assert.deepStrictEqual(externalGateReport.requirements.externalSourceIssues, [{
    id: 'english-units-v1.11',
    path: 'english-units.json',
    sourceKind: 'current-fixture',
    reason: 'source-kind-not-external',
  }]);

  const missingEvidenceReport = buildContentSourceInputBatchAudit({
    manifest: normalizeBatchManifest({
      schemaVersion: 1,
      sourceVersion: 'missing-evidence-fixture-v1',
      sourceKind: 'external-source',
      batches: [{ id: 'english-units-v1.11', path: 'english-units.json', sourceKind: 'external-source' }],
    }),
    baseDirectory: tempDirectory,
    currentCatalog: source,
    requireExternalSource: true,
  });
  assert.strictEqual(missingEvidenceReport.status, 'blocked');
  assert.deepStrictEqual(missingEvidenceReport.requirements.externalSourceIssues, [{
    id: 'english-units-v1.11',
    path: 'english-units.json',
    sourceKind: 'external-source',
    reason: 'source-evidence-missing',
  }]);

  const missingEvidenceUrlReport = buildContentSourceInputBatchAudit({
    manifest: normalizeBatchManifest({
      schemaVersion: 1,
      sourceVersion: 'missing-evidence-url-fixture-v1',
      sourceKind: 'external-source',
      batches: [{
        id: 'english-units-v1.11',
        path: 'english-units.json',
        sourceKind: 'external-source',
        sourceEvidence: {
          sourceKeys: ['source-without-url'],
          sourceUrls: [],
          reviewedAt: '2026-08-10',
          note: '缺少来源链接',
        },
      }],
    }),
    baseDirectory: tempDirectory,
    currentCatalog: source,
    requireExternalSource: true,
  });
  assert.strictEqual(missingEvidenceUrlReport.status, 'blocked');
  assert.deepStrictEqual(missingEvidenceUrlReport.requirements.externalSourceIssues, [{
    id: 'english-units-v1.11',
    path: 'english-units.json',
    sourceKind: 'external-source',
    reason: 'source-evidence-url-missing',
  }]);

  const placeholderEvidenceReport = buildContentSourceInputBatchAudit({
    manifest: normalizeBatchManifest({
      schemaVersion: 1,
      sourceVersion: 'placeholder-evidence-fixture-v1',
      sourceKind: 'external-source',
      batches: [{
        id: 'english-units-v1.11',
        path: 'english-units.json',
        sourceKind: 'external-source',
        sourceEvidence: {
          sourceKeys: ['placeholder-source'],
          sourceUrls: ['https://example.com/not-evidence'],
          reviewedAt: '2026-08-10',
          note: '占位来源链接',
        },
      }],
    }),
    baseDirectory: tempDirectory,
    currentCatalog: source,
    requireExternalSource: true,
  });
  assert.strictEqual(placeholderEvidenceReport.status, 'blocked');
  assert.deepStrictEqual(placeholderEvidenceReport.requirements.externalSourceIssues, [{
    id: 'english-units-v1.11',
    path: 'english-units.json',
    sourceKind: 'external-source',
    reason: 'source-evidence-placeholder-url',
  }]);
  const currentFixtureManifestPath = path.join(tempDirectory, 'current-fixture-manifest.json');
  const externalGateReportPath = path.join(tempDirectory, 'external-gate-report.json');
  fs.writeFileSync(currentFixtureManifestPath, `${JSON.stringify(currentFixtureManifest, null, 2)}\n`, 'utf8');
  const externalGateCliResult = spawnSync(process.execPath, [
    checker,
    currentFixtureManifestPath,
    '--report',
    externalGateReportPath,
    '--require-external-source',
  ], { cwd: root, encoding: 'utf8' });
  assert.notStrictEqual(externalGateCliResult.status, 0);
  const externalGateCliReport = JSON.parse(fs.readFileSync(externalGateReportPath, 'utf8'));
  assert.strictEqual(externalGateCliReport.status, 'blocked');
  assert.match(externalGateCliResult.stdout, /External source blockers/);

  const untrackedInput = {
    ...englishUnits,
    entities: englishUnits.entities.map((entity, index) => (
      index === 0 ? { ...entity, review: { ...entity.review, status: 'untracked' } } : entity
    )),
  };
  const untrackedInputPath = path.join(tempDirectory, 'english-units-untracked.json');
  fs.writeFileSync(untrackedInputPath, `${JSON.stringify(untrackedInput, null, 2)}\n`, 'utf8');
  const reviewGateReport = buildContentSourceInputBatchAudit({
    manifest: normalizeBatchManifest({
      schemaVersion: 1,
      sourceVersion: 'external-review-fixture-v1',
      sourceKind: 'external-source',
      batches: [{ id: 'english-units-v1.11', path: 'english-units-untracked.json' }],
    }),
    baseDirectory: tempDirectory,
    currentCatalog: source,
    requireReviewed: true,
  });
  assert.strictEqual(reviewGateReport.status, 'blocked');
  assert.deepStrictEqual(reviewGateReport.requirements.reviewIssues, [{
    id: 'english-units-v1.11',
    path: 'english-units-untracked.json',
    untracked: 1,
    reason: 'untracked-review-status',
  }]);
  const reviewGateManifestPath = path.join(tempDirectory, 'review-gate-manifest.json');
  const reviewGateReportPath = path.join(tempDirectory, 'review-gate-report.json');
  fs.writeFileSync(reviewGateManifestPath, `${JSON.stringify({
    schemaVersion: 1,
    sourceVersion: 'external-review-fixture-v1',
    sourceKind: 'external-source',
    batches: [{ id: 'english-units-v1.11', path: 'english-units-untracked.json' }],
  }, null, 2)}\n`, 'utf8');
  const reviewGateCliResult = spawnSync(process.execPath, [
    checker,
    reviewGateManifestPath,
    '--report',
    reviewGateReportPath,
    '--require-reviewed',
  ], { cwd: root, encoding: 'utf8' });
  assert.notStrictEqual(reviewGateCliResult.status, 0);
  assert.match(reviewGateCliResult.stdout, /Review status blockers/);

  const changedInput = {
    ...englishUnits,
    entities: englishUnits.entities.map((entity, index) => (
      index === 0 ? { ...entity, title: `${entity.title}（外部变更）` } : entity
    )),
  };
  fs.writeFileSync(inputPath, `${JSON.stringify(changedInput, null, 2)}\n`, 'utf8');
  const changedReport = buildContentSourceInputBatchAudit({
    manifest: normalizeBatchManifest({
      schemaVersion: 1,
      sourceVersion: 'external-fixture-v1',
      sourceKind: 'external-source',
      batches: [{ id: 'english-units-v1.11', path: 'english-units.json' }],
    }),
    baseDirectory: tempDirectory,
    currentCatalog: source,
  });
  assert.strictEqual(changedReport.status, 'changed');
  assert.deepStrictEqual(changedReport.summary, {
    total: 1,
    passed: 0,
    changed: 1,
    pending: 0,
    failed: 0,
  });
  assert.deepStrictEqual(changedReport.batches[0].diff, { added: 0, modified: 1, removed: 0 });

  assert.throws(
    () => normalizeBatchManifest({
      schemaVersion: 1,
      sourceVersion: 'invalid',
      sourceKind: 'unverified-copy',
      batches: [{ id: 'english-units-v1.11', path: 'one.json' }],
    }),
    /sourceKind|无效/i,
  );
  assert.throws(
    () => normalizeBatchManifest({
      schemaVersion: 1,
      sourceVersion: 'invalid',
      batches: [{ id: 'unknown-batch', path: 'unknown.json' }],
    }),
    /未知|batch/i,
  );
  assert.throws(
    () => normalizeBatchManifest({
      schemaVersion: 1,
      sourceVersion: 'invalid',
      batches: [
        { id: 'english-units-v1.11', path: 'one.json' },
        { id: 'english-units-v1.11', path: 'two.json' },
      ],
    }),
    /重复|duplicate/i,
  );
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK content source input batches contract');
