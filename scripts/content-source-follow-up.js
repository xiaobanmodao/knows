const crypto = require('crypto');

const {
  buildContentSourceInputBatchAudit,
  normalizeBatchManifest,
} = require('./content-source-input-batches');
const { buildContentSourceCatalog } = require('./content-source-catalog');
const { getContentSourceBatch } = require('./check-content-source-batches');
const { getContentSourceCandidatesForSubject } = require('../data/content-source-registry');

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

const REQUIRED_FIELDS_BY_TYPE = Object.freeze({
  chapter: ['教材版本与册次', '官方章序和章标题', '官方小节清单', '来源定位与复核日期'],
  unit: ['教材版本与册次', '官方单元序号和单元标题', '单元范围与父级关系', '来源定位与复核日期'],
  theme: ['课标主题边界', '主题标题和父级关系', '知识/方法引用范围', '来源定位与复核日期'],
  topic: ['专题标题和适用范围', '知识点/方法模板引用', '搜索与资源范围', '来源定位与复核日期'],
  knowledge: ['知识点标题和父级关系', '核心字段与示例统计', '来源定位与复核日期'],
  word: ['词条、词性与单元归属', '词形/搭配/例句统计', '来源定位与复核日期'],
  grammar: ['语法点与单元归属', '结构变式/例句统计', '来源定位与复核日期'],
  'structured-knowledge': ['知识点父级关系', '公式/单位/实验字段', '来源定位与复核日期'],
  template: ['方法名称和适用条件', '步骤/示例/图示范围', '来源定位与复核日期'],
  'structured-template': ['方法名称和适用条件', '公式/单位/方向/实验图示', '来源定位与复核日期'],
});

const MATH_CHAPTER_REQUIREMENT = Object.freeze({
  evidenceStatus: 'needs-official-volume-map',
  note: '当前官方公开资料能确认课程范围和结构变化，但尚不足以逐项证明 29 个稳定章节对应新版原始册次、章号和完整标题；需要逐册官方完整目录后再接入。',
  blockedActions: ['重排章节显示顺序', '批量修改章号', '猜测或创建新版章节标题'],
});

function getSourceRequirements(subjectId, type) {
  const special = subjectId === 'math' && type === 'chapter' ? MATH_CHAPTER_REQUIREMENT : null;
  return {
    evidenceStatus: special ? special.evidenceStatus : 'source-evidence-required',
    sourceCandidates: getContentSourceCandidatesForSubject(subjectId),
    requiredFields: [...(REQUIRED_FIELDS_BY_TYPE[type] || ['批次范围、来源定位与复核日期'])],
    note: special ? special.note : '接入前需保留与本批范围一致的官方来源、字段定位和人工复核日期。',
    blockedActions: special ? [...special.blockedActions] : [],
  };
}

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
  'complete-review-status': 1,
  'provide-external-source': 2,
  'review-diff': 3,
  'attach-input-file': 4,
  'no-action': 5,
};

function indexOfOrEnd(values, value) {
  const index = values.indexOf(value);
  return index < 0 ? values.length : index;
}

function inputAvailabilityOrder(batch) {
  return batch.path ? 0 : 1;
}

function getAction(batch, externalSourceIssueIds, reviewIssueIds) {
  if (reviewIssueIds.has(batch.id)) return 'complete-review-status';
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
  requireReviewed = true,
} = {}) {
  const normalized = normalizeBatchManifest(manifest);
  const audit = buildContentSourceInputBatchAudit({
    manifest: normalized,
    baseDirectory,
    currentCatalog,
    requireAllBatches: true,
    requireExternalSource,
    requireReviewed,
  });
  const externalSourceIssueIds = new Set(
    audit.requirements.externalSourceIssues.map((item) => item.id),
  );
  const reviewIssueIds = new Set(
    audit.requirements.reviewIssues.map((item) => item.id),
  );

  const batches = audit.batches.map((batch) => {
    const definition = getContentSourceBatch(batch.id);
    const action = getAction(batch, externalSourceIssueIds, reviewIssueIds);
    return {
      id: batch.id,
      subjectId: batch.subjectId,
      type: batch.type,
      path: batch.path || null,
      sourceKind: batch.sourceKind || 'unknown',
      sourceEvidence: batch.sourceEvidence || null,
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
      review: batch.review || null,
      sourceRequirements: getSourceRequirements(batch.subjectId, batch.type),
      expected: definition ? {
        entities: definition.expectedCount,
        examples: definition.expectedExampleCount,
        experiments: definition.expectedExperimentCount,
        assets: definition.expectedAssetCount,
      } : null,
    };
  }).sort((left, right) => (
    ACTION_ORDER[left.action] - ACTION_ORDER[right.action]
      || inputAvailabilityOrder(left) - inputAvailabilityOrder(right)
      || STATUS_ORDER[left.status] - STATUS_ORDER[right.status]
      || indexOfOrEnd(SUBJECT_ORDER, left.subjectId) - indexOfOrEnd(SUBJECT_ORDER, right.subjectId)
      || indexOfOrEnd(TYPE_ORDER, left.type) - indexOfOrEnd(TYPE_ORDER, right.type)
      || left.id.localeCompare(right.id)
  ));

  const summary = batches.reduce((result, batch) => {
    result.total += 1;
    if (batch.action === 'no-action') result.ready += 1;
    if (batch.status === 'blocked' || batch.action === 'complete-review-status' || batch.action === 'provide-external-source') result.blocked += 1;
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
      requireReviewed,
      externalSourceIssues: audit.requirements.externalSourceIssues,
      reviewIssues: audit.requirements.reviewIssues,
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
