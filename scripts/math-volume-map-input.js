const crypto = require('crypto');

const {
  MATH_CURRICULUM_BASELINE,
  STABLE_CHAPTER_IDS,
} = require('../packages/math/data/math-curriculum-baseline');
const { getContentSource } = require('../data/content-source-registry');

const MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION = 1;
const CURRENT_SOURCE_VERSION = 'v1.11-current';
const ROOT_FIELDS = new Set([
  'schemaVersion',
  'sourceKind',
  'sourceVersion',
  'textbookEdition',
  'sourceIds',
  'reviewedAt',
  'entries',
  'sourceHash',
]);
const ENTRY_FIELDS = new Set([
  'stableChapterId',
  'official',
  'sourceIds',
  'sourceEvidence',
  'reviewedAt',
  'changeReason',
  'legacyAliasImpact',
]);
const OFFICIAL_FIELDS = new Set([
  'officialGrade',
  'officialVolume',
  'officialChapterNo',
  'officialTitle',
  'officialSections',
]);
const SOURCE_EVIDENCE_FIELDS = new Set(['sourceId', 'locator', 'scope']);
const LEGACY_IMPACT_FIELDS = new Set(['stableChapterId', 'lessonIds', 'legacyAliases', 'notes']);
const PLACEHOLDER_TEXT = new Set(['待核对', '待补充', 'unknown', 'tbd', 'todo', 'n/a']);

function fail(message, index) {
  throw new Error(`数学逐册目录输入${index === undefined ? '' : `第 ${index + 1} 条`}：${message}`);
}

function requireText(value, field, index) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} 必须为非空字符串`, index);
  const normalized = value.trim();
  if (PLACEHOLDER_TEXT.has(normalized.toLowerCase())) fail(`${field} 不得使用占位内容`, index);
  return normalized;
}

function requireDate(value, field, index) {
  const normalized = requireText(value, field, index);
  if (Number.isNaN(Date.parse(normalized))) fail(`${field} 日期无效`, index);
  return normalized;
}

function rejectUnexpectedFields(value, allowedFields, label, index) {
  Object.keys(value || {}).forEach((field) => {
    if (!allowedFields.has(field)) fail(`${label} 不支持字段：${field}`, index);
  });
}

function normalizeSourceIds(value, field, index) {
  if (!Array.isArray(value) || !value.length) fail(`${field} 必须为非空数组`, index);
  const sourceIds = [...new Set(value.map((sourceId) => requireText(sourceId, field, index)))].sort();
  if (sourceIds.length !== value.length) fail(`${field} 不得重复`, index);
  sourceIds.forEach((sourceId) => {
    const source = getContentSource(sourceId);
    if (!source || source.kind !== 'official' || !source.url) {
      fail(`${field} 必须引用已登记的官方来源：${sourceId}`, index);
    }
  });
  return sourceIds;
}

function normalizeOfficial(official, index) {
  if (!official || typeof official !== 'object' || Array.isArray(official)) {
    fail('official 必须为对象', index);
  }
  rejectUnexpectedFields(official, OFFICIAL_FIELDS, 'official', index);
  const officialSections = official.officialSections;
  if (!Array.isArray(officialSections) || !officialSections.length) {
    fail('official.officialSections 必须为非空数组', index);
  }
  const sections = officialSections.map((section, sectionIndex) => (
    requireText(section, `official.officialSections[${sectionIndex}]`, index)
  ));
  if (new Set(sections).size !== sections.length) fail('official.officialSections 不得重复', index);
  return {
    officialGrade: requireText(official.officialGrade, 'official.officialGrade', index),
    officialVolume: requireText(official.officialVolume, 'official.officialVolume', index),
    officialChapterNo: requireText(official.officialChapterNo, 'official.officialChapterNo', index),
    officialTitle: requireText(official.officialTitle, 'official.officialTitle', index),
    officialSections: sections,
  };
}

function normalizeSourceEvidence(value, sourceIds, index) {
  if (!Array.isArray(value) || !value.length) {
    fail('sourceEvidence 必须为非空数组', index);
  }
  const evidence = value.map((item, evidenceIndex) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      fail(`sourceEvidence 第 ${evidenceIndex + 1} 项必须为对象`, index);
    }
    rejectUnexpectedFields(item, SOURCE_EVIDENCE_FIELDS, `sourceEvidence 第 ${evidenceIndex + 1} 项`, index);
    const sourceId = requireText(item.sourceId, 'sourceEvidence.sourceId', index);
    if (!sourceIds.includes(sourceId)) {
      fail(`sourceEvidence.sourceId 必须是条目 sourceIds 的子集：${sourceId}`, index);
    }
    return {
      sourceId,
      locator: requireText(item.locator, 'sourceEvidence.locator', index),
      scope: requireText(item.scope, 'sourceEvidence.scope', index),
    };
  });
  const evidenceIds = evidence.map((item) => item.sourceId);
  if (new Set(evidenceIds).size !== evidenceIds.length) {
    fail('sourceEvidence.sourceId 不得重复', index);
  }
  if (JSON.stringify([...evidenceIds].sort()) !== JSON.stringify([...sourceIds].sort())) {
    fail('sourceEvidence 必须逐一覆盖条目 sourceIds', index);
  }
  return evidence.sort((left, right) => left.sourceId.localeCompare(right.sourceId));
}

function normalizeLegacyAliasImpact(value, index) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('legacyAliasImpact 必须为对象', index);
  }
  rejectUnexpectedFields(value, LEGACY_IMPACT_FIELDS, 'legacyAliasImpact', index);
  const stableChapterId = requireText(value.stableChapterId, 'legacyAliasImpact.stableChapterId', index);
  const lessonIds = requireText(value.lessonIds, 'legacyAliasImpact.lessonIds', index);
  const legacyAliases = requireText(value.legacyAliases, 'legacyAliasImpact.legacyAliases', index);
  if (stableChapterId !== 'unchanged' || lessonIds !== 'unchanged' || legacyAliases !== 'preserved') {
    fail('legacyAliasImpact 必须声明 stableChapterId/lessonIds 为 unchanged、legacyAliases 为 preserved', index);
  }
  return {
    stableChapterId,
    lessonIds,
    legacyAliases,
    notes: requireText(value.notes, 'legacyAliasImpact.notes', index),
  };
}

function normalizeEntry(entry, rootSourceIds, index) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail('条目必须为对象', index);
  rejectUnexpectedFields(entry, ENTRY_FIELDS, '条目', index);
  const stableChapterId = requireText(entry.stableChapterId, 'stableChapterId', index);
  if (!STABLE_CHAPTER_IDS.includes(stableChapterId)) {
    fail(`未知稳定章节 ID：${stableChapterId}`, index);
  }
  const sourceIds = normalizeSourceIds(entry.sourceIds, 'sourceIds', index);
  if (sourceIds.some((sourceId) => !rootSourceIds.includes(sourceId))) {
    fail('条目 sourceIds 必须是根级 sourceIds 的子集', index);
  }
  return {
    stableChapterId,
    official: normalizeOfficial(entry.official, index),
    sourceIds,
    sourceEvidence: normalizeSourceEvidence(entry.sourceEvidence, sourceIds, index),
    reviewedAt: requireDate(entry.reviewedAt, 'reviewedAt', index),
    changeReason: requireText(entry.changeReason, 'changeReason', index),
    legacyAliasImpact: normalizeLegacyAliasImpact(entry.legacyAliasImpact, index),
  };
}

function hashInput(input) {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

function normalizeMathVolumeMapInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('根对象无效');
  rejectUnexpectedFields(input, ROOT_FIELDS, '根对象');
  if (input.schemaVersion !== MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION) {
    fail(`schemaVersion 必须为 ${MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION}`);
  }
  if (input.sourceKind !== 'external-source') fail('sourceKind 必须为 external-source');
  const sourceVersion = requireText(input.sourceVersion, 'sourceVersion');
  if (sourceVersion === CURRENT_SOURCE_VERSION) {
    fail(`sourceVersion 不得使用当前内容源版本：${CURRENT_SOURCE_VERSION}`);
  }
  const textbookEdition = requireText(input.textbookEdition, 'textbookEdition');
  const sourceIds = normalizeSourceIds(input.sourceIds, 'sourceIds');
  const expectedSourceIds = MATH_CURRICULUM_BASELINE.sources.map((source) => source.id).sort();
  if (JSON.stringify(sourceIds) !== JSON.stringify(expectedSourceIds)) {
    fail('sourceIds 必须完整覆盖数学目录基线来源');
  }
  const reviewedAt = requireDate(input.reviewedAt, 'reviewedAt');
  if (!Array.isArray(input.entries) || input.entries.length !== STABLE_CHAPTER_IDS.length) {
    fail(`entries 必须完整包含 ${STABLE_CHAPTER_IDS.length} 个稳定章节`);
  }
  const entries = input.entries.map((entry, index) => normalizeEntry(entry, sourceIds, index));
  const entryIds = entries.map((entry) => entry.stableChapterId);
  if (new Set(entryIds).size !== entryIds.length) fail('entries 的稳定章节 ID 不得重复');
  if (JSON.stringify(entryIds) !== JSON.stringify(STABLE_CHAPTER_IDS)) {
    fail('entries 必须按稳定章节 ID 的基线顺序完整排列');
  }

  const normalized = {
    schemaVersion: MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION,
    sourceKind: 'external-source',
    sourceVersion,
    textbookEdition,
    sourceIds,
    reviewedAt,
    entries,
  };
  const sourceHash = hashInput(normalized);
  if (input.sourceHash !== undefined && input.sourceHash !== sourceHash) {
    fail('sourceHash 与输入内容不一致');
  }
  return { ...normalized, sourceHash };
}

function checkMathVolumeMapInput(input) {
  normalizeMathVolumeMapInput(input);
  return true;
}

module.exports = {
  CURRENT_SOURCE_VERSION,
  MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION,
  checkMathVolumeMapInput,
  normalizeMathVolumeMapInput,
};
