const ACTION_ORDER = Object.freeze({
  'fix-input': 0,
  'complete-review-status': 1,
  'provide-external-source': 2,
  'review-diff': 3,
  'attach-input-file': 4,
  'no-action': 5,
});

const PRIORITY_ORDER = Object.freeze({ P0: 0, P1: 1, P2: 2 });
const PACK_SCHEMA_VERSION = 1;

function clone(value) {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}

function requireReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error('内容源跟进报告必须为对象');
  }
  if (report.schemaVersion !== 1) {
    throw new Error('内容源跟进报告 schemaVersion 必须为 1');
  }
  if (!Array.isArray(report.batches) || !report.batches.length) {
    throw new Error('内容源跟进报告 batches 不能为空');
  }
  const ids = new Set();
  report.batches.forEach((batch) => {
    if (!batch || typeof batch !== 'object' || !batch.id) {
      throw new Error('内容源跟进报告批次必须包含 id');
    }
    if (ids.has(batch.id)) throw new Error(`内容源跟进报告批次重复：${batch.id}`);
    ids.add(batch.id);
  });
  if (report.summary && report.summary.nextBatchId && !ids.has(report.summary.nextBatchId)) {
    throw new Error(`内容源跟进报告 nextBatchId 无法定位：${report.summary.nextBatchId}`);
  }
  return report;
}

function sortEntries(left, right) {
  return (ACTION_ORDER[left.action] ?? 99) - (ACTION_ORDER[right.action] ?? 99)
    || (PRIORITY_ORDER[left.priority] ?? 99) - (PRIORITY_ORDER[right.priority] ?? 99)
    || left.id.localeCompare(right.id);
}

function normalizeRequirements(requirements) {
  const value = requirements && typeof requirements === 'object' ? requirements : {};
  return {
    evidenceStatus: value.evidenceStatus || 'source-evidence-required',
    sourceCandidates: Array.isArray(value.sourceCandidates) ? clone(value.sourceCandidates) : [],
    requiredFields: Array.isArray(value.requiredFields) ? [...value.requiredFields] : [],
    note: value.note || '',
    blockedActions: Array.isArray(value.blockedActions) ? [...value.blockedActions] : [],
  };
}

function normalizeEntry(batch) {
  const requirements = normalizeRequirements(batch.sourceRequirements);
  return {
    id: batch.id,
    subjectId: batch.subjectId || null,
    type: batch.type || null,
    action: batch.action || 'no-action',
    priority: batch.priority || 'P2',
    requirements,
    current: {
      path: batch.path || null,
      sourceKind: batch.sourceKind || 'unknown',
      status: batch.status || 'unknown',
      reason: batch.reason || null,
      error: batch.error || null,
      counts: clone(batch.counts || null),
      metrics: clone(batch.metrics || null),
      diff: clone(batch.diff || null),
      inputHash: batch.inputHash || null,
      importedSourceHash: batch.importedSourceHash || null,
      currentSourceHash: batch.currentSourceHash || null,
    },
    expected: clone(batch.expected || null),
    intake: {
      sourceKind: 'external-source',
      inputFormat: 'json-or-csv',
      sourceEvidenceTemplate: {
        sourceKeys: [],
        sourceUrls: [],
        reviewedAt: '',
        note: '',
      },
    },
  };
}

function buildContentSourceIntakePack({ followUpReport } = {}) {
  const report = requireReport(followUpReport);
  const entries = report.batches.map(normalizeEntry).sort(sortEntries);
  const summary = clone(report.summary || {});
  const actionableBatchIds = entries
    .filter((entry) => entry.action !== 'no-action')
    .map((entry) => entry.id);

  return {
    schemaVersion: PACK_SCHEMA_VERSION,
    packType: 'content-source-intake',
    sourceVersion: report.sourceVersion || null,
    generatedFrom: {
      followUpSchemaVersion: report.schemaVersion,
      followUpStatus: report.status || 'unknown',
      manifestHash: report.manifestHash || null,
      currentSourceHash: report.currentSourceHash || null,
    },
    summary,
    actionableBatchIds,
    entries,
  };
}

module.exports = {
  PACK_SCHEMA_VERSION,
  buildContentSourceIntakePack,
};
