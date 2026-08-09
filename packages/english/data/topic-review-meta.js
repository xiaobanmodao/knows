const crypto = require('crypto');

const { getContentReviewMeta } = require('./content-review-meta');

const REVIEWED_ENGLISH_TOPIC_IDS = [
  'eng-topic-vocabulary',
  'eng-topic-sentence',
  'eng-topic-tense',
  'eng-topic-grammar',
  'eng-topic-reading',
  'eng-topic-writing',
];

const SOURCE_REFS = [
  {
    key: 'moe-english-curriculum-2022',
    title: '义务教育课程方案和课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
  },
  {
    key: 'pep-english-new-textbook-2025',
    title: '人教版初中英语新教材介绍',
    url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html',
  },
];

const COMMON_EVIDENCE = [
  '专题标题、适用年级和稳定专题 ID 逐项核对',
  '知识点/方法模板父级、摘要、关键词、检查点和搜索入口逐项核对',
  '复核范围、官方来源和人工复核记录已登记',
];

const TOPIC_REVIEW_RECORDS = {
  'eng-topic-vocabulary': {
    checkedTitle: '词汇与构词',
    checkedGradeBands: ['七年级基础', '八年级进阶', '九年级综合'],
    checkedKnowledgeIds: ['eng-vocab-word-formation', 'eng-vocab-collocation', 'eng-vocab-context'],
    checkedTemplateIds: ['eng-template-word-choice'],
    snapshotHash: 'd4ade3927df4938b026aba47985b7e32d87e3005af85277a17fd6eaca9963886',
  },
  'eng-topic-sentence': {
    checkedTitle: '句子结构',
    checkedGradeBands: ['七年级基础', '八年级进阶', '九年级综合'],
    checkedKnowledgeIds: ['eng-sentence-components', 'eng-sentence-patterns', 'eng-sentence-agreement'],
    checkedTemplateIds: ['eng-template-sentence-skeleton'],
    snapshotHash: 'c3398d4a9757aedcfe03abe60e61bb25f7e46f7dfc9a746a388c348bf1eb85c6',
  },
  'eng-topic-tense': {
    checkedTitle: '时态与语态',
    checkedGradeBands: ['七年级基础', '八年级进阶', '九年级综合'],
    checkedKnowledgeIds: ['eng-tense-basic', 'eng-tense-progress-perfect', 'eng-tense-passive'],
    checkedTemplateIds: ['eng-template-tense-timeline'],
    snapshotHash: '6b07a0c280f6a95ee560a1f5171f0b9d3a36d6d64269425a0eecc1573774f7af',
  },
  'eng-topic-grammar': {
    checkedTitle: '语法难点',
    checkedGradeBands: ['七年级基础', '八年级进阶', '九年级综合'],
    checkedKnowledgeIds: ['eng-grammar-modal-nonfinite', 'eng-grammar-object-clause', 'eng-grammar-relative-adverbial'],
    checkedTemplateIds: ['eng-template-grammar-connection'],
    snapshotHash: 'a8c0b5f88479a12b8fdb0323c96f671979354704129be3286da050f67108a055',
  },
  'eng-topic-reading': {
    checkedTitle: '阅读与完形',
    checkedGradeBands: ['七年级基础', '八年级进阶', '九年级综合'],
    checkedKnowledgeIds: ['eng-reading-structure', 'eng-reading-detail-inference', 'eng-reading-cloze'],
    checkedTemplateIds: ['eng-template-reading-evidence'],
    snapshotHash: 'c50850a8b8a75452b97d38bf8d807cc9eb546a900820be9354615c42c6c51fb7',
  },
  'eng-topic-writing': {
    checkedTitle: '写作表达',
    checkedGradeBands: ['七年级基础', '八年级进阶', '九年级综合'],
    checkedKnowledgeIds: ['eng-writing-paragraph', 'eng-writing-genres', 'eng-writing-revision'],
    checkedTemplateIds: ['eng-template-writing-outline'],
    snapshotHash: '2d88653b4e5f97562452e720fff43fcfe6ef44e1e77506cfec2d9d9ef6c87a4b',
  },
};

function buildEnglishTopicReviewSnapshot(topic) {
  const value = {
    id: topic.id,
    title: topic.title,
    gradeBands: [...(topic.gradeBands || [])],
    knowledgeIds: [...(topic.knowledgeIds || [])],
    templateIds: [...(topic.templateIds || [])],
    summary: topic.summary,
    keywords: [...(topic.keywords || [])],
    signals: [...(topic.signals || [])],
    checkpoints: (topic.checkpoints || []).map((item) => ({ title: item.title, method: item.method })),
    diagramCaption: topic.diagramCaption,
    coverImage: topic.coverImage,
    diagramImage: topic.diagramImage,
    knowledgeCount: topic.knowledgeCount,
    templateCount: (topic.templates || []).length,
    exampleCount: topic.exampleCount,
  };
  return {
    value,
    hash: crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  };
}

function buildReviewMeta(record) {
  return getContentReviewMeta('english', {
    reviewedAt: '2026-08-10',
    sourceLabel: '义务教育英语课程标准（2022年版）与人教版新版教材公开资料（稳定专题复核）',
    sourceRefs: SOURCE_REFS,
    reviewScope: 'stable-topic-container',
    reviewBatch: 'v1.9.7',
    evidence: [...COMMON_EVIDENCE],
    checkedTitle: record.checkedTitle,
    checkedGradeBands: [...record.checkedGradeBands],
    checkedKnowledgeIds: [...record.checkedKnowledgeIds],
    checkedTemplateIds: [...record.checkedTemplateIds],
    snapshotHash: record.snapshotHash,
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getEnglishTopicReviewMeta(topicId) {
  const record = TOPIC_REVIEW_RECORDS[topicId];
  return record ? clone(buildReviewMeta(record)) : null;
}

module.exports = {
  REVIEWED_ENGLISH_TOPIC_IDS,
  TOPIC_REVIEW_RECORDS,
  SOURCE_REFS,
  buildEnglishTopicReviewSnapshot,
  getEnglishTopicReviewMeta,
};
