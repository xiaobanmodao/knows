const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const adapters = require('./subject-adapters');
const { buildContentManifest } = require('./content-manifest');
const { getSubjectRegistry } = require('../data/subject-manifest');
const { SEARCH_INDEX_META, getSearchIndexEntries } = require('../packages/catalog/utils/search-index');
const {
  getReferenceEntries,
} = require('../packages/catalog/utils/reference-index');

const SUBJECT_ORDER = ['biology', 'chemistry', 'english', 'math', 'physics'];
const FORBIDDEN_FIELDS = new Set([
  'practiceFlow',
  'finishCriteria',
  'outputTask',
  'selfCheck',
  'learningPath',
]);
const ASSET_KEYS = /^(coverImage|diagramImage|sourceImage|figure|figurePath|image|imagePath)$/i;
const OFFICIAL_HOSTS = new Set(['www.moe.gov.cn', 'moe.gov.cn', 'www.pep.com.cn', 'pep.com.cn']);
const KNOWN_SOURCE_KEYS = new Set([
  'moe-biology-curriculum-2022',
  'pep-compulsory-biology-textbook',
  'moe-chemistry-2022',
  'moe-textbook-catalog-2024',
  'pep-chemistry-training-2024',
  'moe-math-curriculum-2022',
  'pep-math-current-catalog',
  'pep-math-new-textbook-2024',
  'original-derivation-review',
  'moe-physics-2022',
  'moe-physics-experiments',
  'pep-physics-public',
  'cambridge-dictionary',
  'oxford-learners-dictionaries',
  'cambridge-grammar',
  'british-council-grammar',
  'moe-english-curriculum-2022',
  'pep-english-new-textbook-2025',
]);

function sha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function countArray(value) {
  return Array.isArray(value) ? value.length : 0;
}

function getParentId(entity) {
  return entity.themeId
    || entity.gradeId
    || entity.chapterId
    || entity.unitId
    || entity.topicId
    || entity.bookId
    || (Array.isArray(entity.chapterIds) && entity.chapterIds[0])
    || (Array.isArray(entity.topicIds) && entity.topicIds[0])
    || (Array.isArray(entity.relatedChapters) && entity.relatedChapters[0])
    || (Array.isArray(entity.relatedTopicIds) && entity.relatedTopicIds[0])
    || null;
}

function collectAssetRefs(value, key = '', refs = [], seen = new Set()) {
  if (value === null || value === undefined) return refs;
  if (typeof value === 'string') {
    if (ASSET_KEYS.test(key) && value.trim()) refs.push(value.trim());
    return refs;
  }
  if (typeof value !== 'object' || seen.has(value)) return refs;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => collectAssetRefs(item, key, refs, seen));
  } else {
    Object.entries(value).forEach(([childKey, childValue]) => (
      collectAssetRefs(childValue, childKey, refs, seen)
    ));
  }
  return refs;
}

function collectForbiddenFields(value, fields = [], seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return fields;
  seen.add(value);
  Object.entries(value).forEach(([key, childValue]) => {
    if (FORBIDDEN_FIELDS.has(key)) fields.push(key);
    collectForbiddenFields(childValue, fields, seen);
  });
  return unique(fields).sort();
}

function getReviewMeta(entity) {
  const meta = entity.contentMeta || entity.review || {};
  const sourceRefs = Array.isArray(meta.sourceRefs)
    ? meta.sourceRefs.map((source) => ({
      key: source.key || '',
      title: source.title || '',
      url: source.url || '',
    }))
    : (Array.isArray(meta.sourceKeys) ? meta.sourceKeys.map((key) => ({ key, title: '', url: '' })) : []);
  return {
    status: meta.status || 'untracked',
    reviewedAt: meta.reviewedAt || '',
    sourceRefs,
  };
}

function normalizeEntity(subjectId, type, entity) {
  const review = getReviewMeta(entity);
  const examples = countArray(entity.examples) + countArray(entity.problems);
  const experiments = (entity.safetyObservation ? 1 : 0)
    + (Array.isArray(entity.sections) ? entity.sections.filter((section) => section.type === 'experiment').length : 0);
  return {
    subjectId,
    type,
    id: entity.id || '',
    title: entity.title || entity.name || entity.word || '',
    parentId: getParentId(entity),
    reviewed: review,
    exampleCount: examples,
    experimentCount: experiments,
    assetRefs: unique(collectAssetRefs(entity)),
    forbiddenFields: collectForbiddenFields(entity),
  };
}

function collectEntities() {
  return adapters
    .flatMap((adapter) => adapter.getManifestEntities().flatMap(({ type, entities }) => (
      entities.map((entity) => normalizeEntity(adapter.subjectId, type, entity))
    )))
    .sort((a, b) => (
      a.subjectId.localeCompare(b.subjectId)
      || a.type.localeCompare(b.type)
      || a.id.localeCompare(b.id)
    ));
}

function summarizeSubject(subject, entities) {
  const counts = {};
  entities.forEach((entity) => {
    counts[entity.type] = (counts[entity.type] || 0) + 1;
  });
  counts.example = entities.reduce((sum, entity) => sum + entity.exampleCount, 0);
  counts.experiment = entities.reduce((sum, entity) => sum + entity.experimentCount, 0);
  counts.assetReference = entities.reduce((sum, entity) => sum + entity.assetRefs.length, 0);

  const reviewStatuses = entities.map((entity) => entity.reviewed.status);
  const sourceRefs = entities.flatMap((entity) => entity.reviewed.sourceRefs);
  const reviewed = {
    total: entities.length,
    verified: reviewStatuses.filter((status) => status === 'verified').length,
    reviewed: reviewStatuses.filter((status) => status === 'reviewed').length,
    missing: reviewStatuses.filter((status) => status === 'untracked').length,
    sourceReferenceCount: sourceRefs.length,
    sourceKeys: unique(sourceRefs.map((source) => source.key).filter(Boolean)).sort(),
    sourceUrls: unique(sourceRefs.map((source) => source.url).filter(Boolean)).sort(),
  };
  return {
    id: subject.id,
    name: subject.name,
    status: subject.status,
    packageRoot: subject.packageRoot,
    counts,
    registryCounts: { ...(subject.counts || {}) },
    reviewed,
    examples: counts.example,
    experiments: counts.experiment,
    assets: counts.assetReference,
    issues: unique(entities.flatMap((entity) => entity.forbiddenFields)).sort(),
  };
}

function buildContentDiff() {
  const baselinePath = path.join(__dirname, 'fixtures/content-manifest-v1.3.json');
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const current = buildContentManifest('v1.9-current');
  const baselineKeys = new Set(Object.keys(baseline.entities));
  const currentKeys = new Set(Object.keys(current.entities));
  const added = [...currentKeys].filter((key) => !baselineKeys.has(key));
  const removed = [...baselineKeys].filter((key) => !currentKeys.has(key));
  const modified = [...currentKeys].filter((key) => (
    baselineKeys.has(key) && baseline.entities[key].hash !== current.entities[key].hash
  ));
  return {
    baselineVersion: baseline.version,
    currentVersion: current.version,
    baselineCount: baseline.entityCount,
    currentCount: current.entityCount,
    added: added.length,
    modified: modified.length,
    removed: removed.length,
    sourceHash: sha256(current),
  };
}

function buildSearchSummary() {
  const entries = getSearchIndexEntries();
  const entities = collectEntities();
  const searchKeys = new Set(entries.map((entry) => entry.key));
  const searchableEntities = entities.filter((entity) => entity.type !== 'theme');
  const missingEntityKeys = searchableEntities
    .map((entity) => {
      const searchType = entity.type.replace(/^structured-/, '');
      return `${entity.subjectId}:${searchType}:${entity.id}`;
    })
    .filter((key) => !searchKeys.has(key));
  return {
    entryCount: entries.length,
    sourceHash: SEARCH_INDEX_META.sourceHash,
    subjectCounts: { ...(SEARCH_INDEX_META.subjectCounts || {}) },
    coverage: {
      expectedEntityCount: searchableEntities.length,
      missingEntityKeys,
      excludedTypes: ['theme'],
    },
  };
}

function buildReferenceSummary() {
  const kinds = ['word', 'grammar', 'formula', 'experiment', 'equation'];
  const entries = kinds
    .flatMap((kind) => getReferenceEntries(kind))
    .sort((a, b) => a.key.localeCompare(b.key));
  const counts = Object.fromEntries(kinds.map((kind) => [
    kind,
    entries.filter((entry) => entry.kind === kind).length,
  ]));
  return {
    entryCount: Object.values(counts).reduce((sum, count) => sum + count, 0),
    sourceHash: sha256(entries),
    coverage: 'all-reference-entries',
    counts,
  };
}

function collectContentAudit() {
  const registry = getSubjectRegistry().sort((a, b) => a.id.localeCompare(b.id));
  const entities = collectEntities();
  const subjects = registry.map((subject) => summarizeSubject(
    subject,
    entities.filter((entity) => entity.subjectId === subject.id),
  ));
  const manifest = buildContentManifest('v1.9-current');
  return {
    schemaVersion: 1,
    subjects,
    totals: {
      entityCount: entities.length,
      manifestEntityCount: manifest.entityCount,
      exampleCount: entities.reduce((sum, entity) => sum + entity.exampleCount, 0),
      experimentCount: entities.reduce((sum, entity) => sum + entity.experimentCount, 0),
      assetReferenceCount: entities.reduce((sum, entity) => sum + entity.assetRefs.length, 0),
      sourceReferenceCount: entities.reduce((sum, entity) => sum + entity.reviewed.sourceRefs.length, 0),
      reviewedCount: entities.filter((entity) => ['verified', 'reviewed'].includes(entity.reviewed.status)).length,
      untrackedCount: entities.filter((entity) => entity.reviewed.status === 'untracked').length,
    },
    contentDiff: buildContentDiff(),
    search: buildSearchSummary(),
    references: buildReferenceSummary(),
  };
}

function checkAuditReport(report, { requireReviewed = false } = {}) {
  if (!report || report.schemaVersion !== 1) throw new Error('审计报告 schemaVersion 必须为 1');
  if (!Array.isArray(report.subjects) || report.subjects.length !== SUBJECT_ORDER.length) {
    throw new Error('审计报告必须覆盖五个启用学科');
  }
  if (report.subjects.map((subject) => subject.id).join(',') !== SUBJECT_ORDER.join(',')) {
    throw new Error(`审计报告学科顺序无效：${report.subjects.map((subject) => subject.id).join(',')}`);
  }
  const entities = collectEntities();
  const ids = new Set();
  const scopedIds = new Set();
  entities.forEach((entity) => {
    const key = `${entity.subjectId}:${entity.type}:${entity.id}`;
    if (!entity.id || !entity.title) throw new Error(`审计实体缺少 ID 或标题：${key}`);
    if (ids.has(key)) throw new Error(`审计实体重复：${key}`);
    ids.add(key);
    const scopedId = `${entity.subjectId}:${entity.id}`;
    if (scopedIds.has(scopedId)) throw new Error(`学科内稳定 ID 重复：${scopedId}`);
    scopedIds.add(scopedId);
    if (!['verified', 'reviewed', 'untracked'].includes(entity.reviewed.status)) {
      throw new Error(`审计实体未复核：${key}`);
    }
    if (requireReviewed && entity.reviewed.status === 'untracked') {
      throw new Error(`审计实体尚未登记复核：${key}`);
    }
    if (entity.reviewed.status !== 'untracked' && !/^\d{4}-\d{2}-\d{2}$/.test(entity.reviewed.reviewedAt)) {
      throw new Error(`审计实体复核日期无效：${key}`);
    }
    if (entity.reviewed.status !== 'untracked' && entity.reviewed.sourceRefs.length < 2) {
      throw new Error(`审计实体来源不足：${key}`);
    }
    entity.reviewed.sourceRefs.forEach((source) => {
      if (!source.key && !source.url) throw new Error(`审计实体来源缺少 key 或 URL：${key}`);
      if (source.key && !KNOWN_SOURCE_KEYS.has(source.key)) {
        throw new Error(`审计实体来源 key 未登记：${key}/${source.key}`);
      }
      if (!source.url) return;
      const hostname = new URL(source.url).hostname;
      if (!OFFICIAL_HOSTS.has(hostname)) throw new Error(`审计实体来源域名不受信任：${key}/${hostname}`);
    });
    if (entity.forbiddenFields.length) {
      throw new Error(`审计实体含任务型字段：${key}/${entity.forbiddenFields.join(',')}`);
    }
  });
  if (report.totals.entityCount !== entities.length || report.totals.manifestEntityCount !== entities.length) {
    throw new Error('审计总实体数与采集结果不一致');
  }
  if (report.search.entryCount !== getSearchIndexEntries().length) throw new Error('搜索索引数量与审计报告不一致');
  if (report.search.coverage && report.search.coverage.missingEntityKeys.length) {
    throw new Error(`搜索索引缺少实体：${report.search.coverage.missingEntityKeys.join(',')}`);
  }
  if (report.references.entryCount !== 664) throw new Error(`参考索引数量应为 664，当前 ${report.references.entryCount}`);
  if (report.references.coverage !== 'all-reference-entries') throw new Error('参考索引哈希未声明覆盖全部入口');
  ['contentDiff', 'search', 'references'].forEach((key) => {
    if (!/^[a-f0-9]{64}$/.test(report[key].sourceHash)) throw new Error(`${key}.sourceHash 格式无效`);
  });
  return true;
}

module.exports = {
  SUBJECT_ORDER,
  collectAuditEntities: collectEntities,
  collectContentAudit,
  checkAuditReport,
};
