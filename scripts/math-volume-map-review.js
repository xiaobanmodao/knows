const crypto = require('crypto');

const { STABLE_CHAPTER_IDS } = require('../packages/math/data/math-curriculum-baseline');

const REVIEW_SCHEMA_VERSION = 1;
const REVIEW_TYPE = 'math-volume-map-review';
const REVIEW_FIELDS = new Set([
  'schemaVersion',
  'reviewType',
  'decision',
  'diffReportHash',
  'inputSourceHash',
  'reviewer',
  'reviewedAt',
  'entries',
]);
const ENTRY_FIELDS = new Set(['stableChapterId', 'decision', 'notes']);
const DECISIONS = new Set(['approved', 'needs-changes']);
const ENTRY_DECISIONS = new Set(['accepted', 'needs-changes']);

function fail(message) {
  throw new Error(`数学逐册目录人工确认：${message}`);
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} 必须为非空字符串`);
  return value.trim();
}

function requireHash(value, field) {
  const hash = requireText(value, field);
  if (!/^[a-f0-9]{64}$/.test(hash)) fail(`${field} 必须为 64 位十六进制哈希`);
  return hash;
}

function requireDate(value, field) {
  const date = requireText(value, field);
  if (Number.isNaN(Date.parse(date))) fail(`${field} 日期无效`);
  return date;
}

function rejectUnexpectedFields(value, allowedFields, label) {
  Object.keys(value || {}).forEach((field) => {
    if (!allowedFields.has(field)) fail(`${label} 不支持字段：${field}`);
  });
}

function hashValue(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function hashMathVolumeMapDiff(diffReport) {
  return hashValue(diffReport);
}

function normalizeDiffReport(diffReport) {
  if (!diffReport || typeof diffReport !== 'object' || Array.isArray(diffReport)) {
    fail('差异报告无效');
  }
  if (diffReport.schemaVersion !== 1 || diffReport.reportType !== 'math-volume-map-diff') {
    fail('差异报告类型或版本无效');
  }
  if (diffReport.status !== 'manual-review-required') {
    fail('差异报告必须处于 manual-review-required 状态');
  }
  if (!Array.isArray(diffReport.entries) || diffReport.entries.length !== STABLE_CHAPTER_IDS.length) {
    fail(`差异报告必须包含 ${STABLE_CHAPTER_IDS.length} 条章节记录`);
  }
  const ids = diffReport.entries.map((entry) => entry && entry.stableChapterId);
  if (JSON.stringify(ids) !== JSON.stringify(STABLE_CHAPTER_IDS)) {
    fail('差异报告必须按稳定章节 ID 基线顺序排列');
  }
  if (!diffReport.stability
    || diffReport.stability.stableChapterIdsPreserved !== true
    || diffReport.stability.lessonIdsPreserved !== true
    || diffReport.stability.legacyAliasesPreserved !== true) {
    fail('差异报告未确认稳定 ID、lessonId 或旧别名保持关系');
  }
  return diffReport;
}

function normalizeReviewEntries(value) {
  if (!Array.isArray(value) || value.length !== STABLE_CHAPTER_IDS.length) {
    fail(`entries 必须完整包含 ${STABLE_CHAPTER_IDS.length} 条人工确认记录`);
  }
  const entries = value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      fail(`entries 第 ${index + 1} 项必须为对象`);
    }
    rejectUnexpectedFields(entry, ENTRY_FIELDS, `entries 第 ${index + 1} 项`);
    const stableChapterId = requireText(entry.stableChapterId, `entries 第 ${index + 1} 项 stableChapterId`);
    if (!STABLE_CHAPTER_IDS.includes(stableChapterId)) {
      fail(`entries 第 ${index + 1} 项包含未知稳定章节 ID：${stableChapterId}`);
    }
    const decision = requireText(entry.decision, `entries 第 ${index + 1} 项 decision`);
    if (!ENTRY_DECISIONS.has(decision)) fail(`entries 第 ${index + 1} 项 decision 无效：${decision}`);
    return {
      stableChapterId,
      decision,
      notes: requireText(entry.notes, `entries 第 ${index + 1} 项 notes`),
    };
  });
  const ids = entries.map((entry) => entry.stableChapterId);
  if (new Set(ids).size !== ids.length) fail('entries 的稳定章节 ID 不得重复');
  if (JSON.stringify(ids) !== JSON.stringify(STABLE_CHAPTER_IDS)) {
    fail('人工确认 entries 必须按稳定章节 ID 基线顺序排列');
  }
  return entries;
}

function normalizeMathVolumeMapReview({ diffReport, review } = {}) {
  const normalizedDiff = normalizeDiffReport(diffReport);
  if (!review || typeof review !== 'object' || Array.isArray(review)) fail('确认输入根对象无效');
  rejectUnexpectedFields(review, REVIEW_FIELDS, '确认输入');
  if (review.schemaVersion !== REVIEW_SCHEMA_VERSION) {
    fail(`schemaVersion 必须为 ${REVIEW_SCHEMA_VERSION}`);
  }
  if (review.reviewType !== REVIEW_TYPE) fail(`reviewType 必须为 ${REVIEW_TYPE}`);
  const decision = requireText(review.decision, 'decision');
  if (!DECISIONS.has(decision)) fail(`decision 无效：${decision}`);
  const diffReportHash = requireHash(review.diffReportHash, 'diffReportHash');
  const actualDiffReportHash = hashMathVolumeMapDiff(normalizedDiff);
  if (diffReportHash !== actualDiffReportHash) fail('diffReportHash 与差异报告不一致');
  const inputSourceHash = requireHash(review.inputSourceHash, 'inputSourceHash');
  if (inputSourceHash !== normalizedDiff.inputSourceHash) fail('inputSourceHash 与差异报告不一致');
  const entries = normalizeReviewEntries(review.entries);
  if (decision === 'approved' && entries.some((entry) => entry.decision !== 'accepted')) {
    fail('approved 必须逐条确认 accepted');
  }
  if (decision === 'needs-changes' && entries.every((entry) => entry.decision === 'accepted')) {
    fail('needs-changes 至少需要一条 needs-changes 记录');
  }
  const normalized = {
    schemaVersion: REVIEW_SCHEMA_VERSION,
    reviewType: REVIEW_TYPE,
    status: decision,
    diffReportHash,
    inputSourceHash,
    reviewer: requireText(review.reviewer, 'reviewer'),
    reviewedAt: requireDate(review.reviewedAt, 'reviewedAt'),
    entries,
  };
  return {
    ...normalized,
    reviewHash: hashValue(normalized),
  };
}

module.exports = {
  REVIEW_SCHEMA_VERSION,
  hashMathVolumeMapDiff,
  normalizeMathVolumeMapReview,
};
