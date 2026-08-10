const crypto = require('crypto');

const {
  buildContentSourceInputBatchAudit,
  normalizeBatchManifest,
} = require('./content-source-input-batches');
const { buildContentSourceCatalog } = require('./content-source-catalog');
const { getContentSourceBatch } = require('./check-content-source-batches');

const SUBJECT_ORDER = ['math', 'english', 'physics', 'chemistry', 'biology'];
const TYPE_ORDER = [
  'chapter', 'unit', 'theme', 'topic', 'knowledge', 'word', 'grammar',
  'structured-knowledge', 'template', 'structured-template',
];
const STATUS_ORDER = {
  failed: 0,
  blocked: 1,
  changed: 2,
  pending: 3,
  passed: 4,
};

function hashManifest(manifest) {
  return crypto.createHash('sha256').update(JSON.stringify({
    schemaVersion: manifest.schemaVersion,
    sourceVersion: manifest.sourceVersion,
    sourceKind: manifest.sourceKind,
    batches: manifest.batches,
})).digest('hex');
}

const ACTION_ORDER = {
  'fix-input': 0,
  'provide-external-source': 1,
  'review-diff': 2,
  'attach-input-file': 3,
  'no-action': 4,
};

function indexOfOrEnd(values, value) {
  const index = values.indexOf(value);
  return index < 0 ? values.length : index;
}

function getAction(batch, externalSourceIssueIds) {
  if (externalSourceIssueIds.has(batch.id)) return 'provide-external-source';
  if (batch.status === 'failed') return 'fix-input';
  if (batch.status === 'changed') return 'review-diff';
  if (batch.status === 'pending') return 'attach-input-file';
  return 'no-action';
}

function getPriority(batch, action) {
  if (action === 'fix-input' || batch.status === 'failed' || batch.status === 'blocked') return 'P0';
  if (action !== 'no-action') return 'P1';
  return 'P2';
}

function buildContentSourceFollowUpReport({
  manifest,
  baseDirectory = process.cwd(),
  currentCatalog = buildContentSourceCatalog(),
  requireExternalSource = true,
} = {}) {
  const normalized = normalizeBatchManifest(manifest);
  const audit = buildContentSourceInputBatchAudit({
    manifest: normalized,
    baseDirectory,
    currentCatalog,
    requireAllBatches: true,
    requireExternalSource,
  });
  const externalSourceIssueIds = new Set(
    audit.requirements.externalSourceIssues.map((item) => item.id),
  );

  const batches = audit.batches.map((batch) => {
    const definition = getContentSourceBatch(batch.id);
    const action = getAction(batch, externalSourceIssueIds);
    return {
      id: batch.id,
      subjectId: batch.subjectId,
      type: batch.type,
      path: batch.path || null,
      sourceKind: batch.sourceKind || 'unknown',
      status: batch.status,
      priority: getPriority(batch, action),
      action,
      reason: batch.reason || null,
      error: batch.error || null,
      counts: batch.counts || null,
      metrics: batch.metrics || null,
      diff: batch.diff || null,
      inputHash: batch.inputHash || null,
      importedSourceHash: batch.importedSourceHash || null,
      currentSourceHash: batch.currentSourceHash || null,
      expected: definition ? {
        entities: definition.expectedCount,
        examples: definition.expectedExampleCount,
        experiments: definition.expectedExperimentCount,
        assets: definition.expectedAssetCount,
      } : null,
    };
  }).sort((left, right) => (
    ACTION_ORDER[left.action] - ACTION_ORDER[right.action]
      || STATUS_ORDER[left.status] - STATUS_ORDER[right.status]
      || indexOfOrEnd(SUBJECT_ORDER, left.subjectId) - indexOfOrEnd(SUBJECT_ORDER, right.subjectId)
      || indexOfOrEnd(TYPE_ORDER, left.type) - indexOfOrEnd(TYPE_ORDER, right.type)
      || left.id.localeCompare(right.id)
  ));

  const summary = batches.reduce((result, batch) => {
    result.total += 1;
    if (batch.action === 'no-action') result.ready += 1;
    if (batch.status === 'blocked' || batch.action === 'provide-external-source') result.blocked += 1;
    if (batch.status === 'pending') result.pending += 1;
    if (batch.status === 'changed') result.changed += 1;
    if (batch.status === 'failed') result.failed += 1;
    if (batch.action === 'provide-external-source') result.externalSourceMissing += 1;
    return result;
  }, {
    total: 0,
    ready: 0,
    blocked: 0,
    pending: 0,
    changed: 0,
    failed: 0,
    externalSourceMissing: 0,
  });
  const nextBatch = batches.find((batch) => batch.action !== 'no-action') || null;
  const status = summary.failed || summary.blocked
    ? 'blocked'
    : summary.pending || summary.changed
      ? 'needs-review'
      : 'ready';

  return {
    schemaVersion: 1,
    sourceVersion: normalized.sourceVersion,
    sourceKind: normalized.sourceKind,
    manifestHash: hashManifest(normalized),
    currentSourceHash: currentCatalog.sourceHash,
    status,
    requirements: {
      requireExternalSource,
      externalSourceIssues: audit.requirements.externalSourceIssues,
    },
    summary: {
      ...summary,
      nextBatchId: nextBatch ? nextBatch.id : null,
    },
    batches,
  };
}

module.exports = {
  buildContentSourceFollowUpReport,
};
