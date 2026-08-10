const crypto = require('crypto');

const { collectAuditEntities } = require('./content-audit');
const { getContentSourceCandidatesForSubject } = require('../data/content-source-registry');

const SUBJECT_ORDER = ['math', 'english', 'physics'];
const SUBJECT_RANK = Object.fromEntries(SUBJECT_ORDER.map((id, index) => [id, index]));
const TYPE_RANK = {
  chapter: 0,
  unit: 0,
  theme: 0,
  topic: 1,
  template: 2,
  'structured-template': 2,
};
const PRIORITY_BY_TYPE = {
  chapter: 1,
  unit: 1,
  theme: 1,
  topic: 1,
  template: 2,
  'structured-template': 2,
};
const PRIORITY_REASON = {
  1: '先复核容器边界、归属和入口，后续知识与方法内容才有稳定上下文。',
  2: '容器边界确认后复核方法适用条件、步骤、示例和图示。',
};
const EVIDENCE_BY_TYPE = {
  chapter: ['教材目录范围与章节顺序', '章节标题、摘要与稳定父级关系', '来源与人工复核记录'],
  unit: ['教材单元范围与单元顺序', '单元标题、摘要与稳定父级关系', '来源与人工复核记录'],
  theme: ['课标主题边界与主题归属', '主题标题、摘要与稳定引用关系', '来源与人工复核记录'],
  topic: ['专题归属与知识点/方法模板引用', '专题摘要、关键词与搜索入口', '来源与人工复核记录'],
  template: ['方法适用条件与步骤', '原创示例或图示与易错边界', '来源与人工复核记录'],
  'structured-template': ['方法适用条件与步骤', '物理公式、单位、方向或实验图示', '来源与人工复核记录'],
};

function sha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function searchType(type) {
  return type.replace(/^structured-/, '');
}

function compareItems(a, b) {
  return (a.priority - b.priority)
    || ((SUBJECT_RANK[a.subjectId] ?? 99) - (SUBJECT_RANK[b.subjectId] ?? 99))
    || ((TYPE_RANK[a.type] ?? 99) - (TYPE_RANK[b.type] ?? 99))
    || a.id.localeCompare(b.id);
}

function buildItem(entity) {
  const priority = PRIORITY_BY_TYPE[entity.type];
  if (!priority) throw new Error(`复核队列遇到未定义类型：${entity.subjectId}/${entity.type}/${entity.id}`);
  return {
    key: `${entity.subjectId}:${entity.type}:${entity.id}`,
    subjectId: entity.subjectId,
    type: entity.type,
    id: entity.id,
    title: entity.title,
    parentId: entity.parentId,
    status: entity.reviewed.status,
    priority,
    priorityReason: PRIORITY_REASON[priority],
    searchKey: `${entity.subjectId}:${searchType(entity.type)}:${entity.id}`,
    sourceCandidates: getContentSourceCandidatesForSubject(entity.subjectId),
    evidence: [...EVIDENCE_BY_TYPE[entity.type]],
  };
}

function collectContentReviewQueue() {
  const items = collectAuditEntities()
    .filter((entity) => entity.reviewed.status === 'untracked')
    .map(buildItem)
    .sort(compareItems);
  const bySubject = Object.fromEntries(SUBJECT_ORDER.map((subjectId) => [
    subjectId,
    items.filter((item) => item.subjectId === subjectId).length,
  ]));
  const byType = {};
  const byPriority = {};
  items.forEach((item) => {
    const typeKey = `${item.subjectId}:${item.type}`;
    byType[typeKey] = (byType[typeKey] || 0) + 1;
    byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
  });
  return {
    schemaVersion: 1,
    sourceVersion: 'v1.9-current',
    status: 'review-queue',
    totals: {
      queued: items.length,
      bySubject,
      byType,
      byPriority,
    },
    sourceHash: sha256(items),
    items,
  };
}

function checkContentReviewQueue(report) {
  if (!report || report.schemaVersion !== 1) throw new Error('复核队列 schemaVersion 必须为 1');
  if (report.status !== 'review-queue') throw new Error('复核队列 status 无效');
  if (!Array.isArray(report.items)) throw new Error('复核队列 items 必须为数组');

  const expected = collectContentReviewQueue();
  const allEntityKeys = new Set(collectAuditEntities().map((entity) => `${entity.subjectId}:${entity.id}`));
  if (report.sourceVersion !== expected.sourceVersion) throw new Error('复核队列 sourceVersion 不一致');
  if (report.totals.queued !== expected.items.length || report.items.length !== expected.items.length) {
    throw new Error(`复核队列数量不一致：报告 ${report.items.length}，当前 ${expected.items.length}`);
  }
  if (JSON.stringify(report.items) !== JSON.stringify(expected.items)) {
    throw new Error('复核队列条目、顺序或复核说明与当前内容源不一致');
  }
  if (report.sourceHash !== sha256(report.items)) throw new Error('复核队列 sourceHash 与条目不一致');
  if (JSON.stringify(report.totals) !== JSON.stringify(expected.totals)) {
    throw new Error('复核队列分组统计与条目不一致');
  }

  const keys = new Set();
  report.items.forEach((item) => {
    if (keys.has(item.key)) throw new Error(`复核队列 key 重复：${item.key}`);
    keys.add(item.key);
    if (item.status !== 'untracked') throw new Error(`复核队列包含非 untracked 实体：${item.key}`);
    if (!item.title || !item.searchKey || !item.parentId && ['template', 'structured-template'].includes(item.type)) {
      throw new Error(`复核队列条目字段不完整：${item.key}`);
    }
    if (item.parentId && !allEntityKeys.has(`${item.subjectId}:${item.parentId}`)) {
      throw new Error(`复核队列父级不存在或跨学科：${item.key}/${item.parentId}`);
    }
    if (!Array.isArray(item.sourceCandidates) || item.sourceCandidates.length < 2) {
      throw new Error(`复核队列来源候选不足：${item.key}`);
    }
    if (!Array.isArray(item.evidence) || item.evidence.length < 3) {
      throw new Error(`复核队列证据要求不足：${item.key}`);
    }
  });
  return true;
}

module.exports = {
  collectContentReviewQueue,
  checkContentReviewQueue,
};
