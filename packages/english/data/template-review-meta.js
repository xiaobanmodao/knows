const { getContentReviewMeta } = require('./content-review-meta');

const REVIEWED_ENGLISH_TEMPLATE_IDS = [
  'eng-template-word-choice',
  'eng-template-sentence-skeleton',
  'eng-template-tense-timeline',
  'eng-template-grammar-connection',
  'eng-template-reading-evidence',
  'eng-template-writing-outline',
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
  '模板标题、分类、稳定 ID 和专题父级逐项核对',
  '适用信号、方法步骤、易错边界、原创示例和图示入口逐项核对',
  '复核范围、官方来源、英语内容边界和人工复核记录已登记',
];

const TEMPLATE_REVIEW_RECORDS = {
  'eng-template-word-choice': {
    checkedTitle: '词汇四步判断法',
    checkedCategory: '词汇运用',
    checkedTopicIds: ['eng-topic-vocabulary'],
    snapshotHash: '1809adadb90303efacc90d3a025fd26a4aec600fbaafd4311cdc6c84c1ec7f30',
    runtimeExampleCount: 3,
    figureSource: 'shared-generated-asset',
  },
  'eng-template-sentence-skeleton': {
    checkedTitle: '句子骨架分析法',
    checkedCategory: '句法基础',
    checkedTopicIds: ['eng-topic-sentence'],
    snapshotHash: '4edcec318493822c63edd5068c89ad3846ce5349fd1d4ed9ed8f432032b3730d',
    runtimeExampleCount: 3,
    figureSource: 'shared-generated-asset',
  },
  'eng-template-tense-timeline': {
    checkedTitle: '时态时间轴判断法',
    checkedCategory: '动词语法',
    checkedTopicIds: ['eng-topic-tense'],
    snapshotHash: '9692c9b24768f92c5e0f6d94a9a28722ea4ae8556814c66b77fe514cd5d32020',
    runtimeExampleCount: 3,
    figureSource: 'shared-generated-asset',
  },
  'eng-template-grammar-connection': {
    checkedTitle: '复杂语法定位法',
    checkedCategory: '语法综合',
    checkedTopicIds: ['eng-topic-grammar'],
    snapshotHash: '81a9671b6e9ef2c5c34b7a0532168c3f57531f96fc2e1da28bf9c03d161f0d8f',
    runtimeExampleCount: 3,
    figureSource: 'shared-generated-asset',
  },
  'eng-template-reading-evidence': {
    checkedTitle: '阅读证据定位法',
    checkedCategory: '阅读理解',
    checkedTopicIds: ['eng-topic-reading'],
    snapshotHash: 'b1483cfadf9191582205e06249e65dd4a0b06ff9de7d12a17c739dc71b347fe4',
    runtimeExampleCount: 3,
    figureSource: 'shared-generated-asset',
  },
  'eng-template-writing-outline': {
    checkedTitle: '英语写作四段流程',
    checkedCategory: '书面表达',
    checkedTopicIds: ['eng-topic-writing'],
    snapshotHash: '05868bc5a2456cf9c27b8b7d6b610e98940dcdb926152e193e9dc940f8930f29',
    runtimeExampleCount: 3,
    figureSource: 'shared-generated-asset',
  },
};

function buildEnglishTemplateReviewSnapshot(template, runtimeTemplate) {
  // 复核快照只在构建/校验脚本中执行，避免小程序包加载 Node 内置模块。
  const crypto = require('crypto');
  const value = {
    id: template.id,
    name: template.name,
    category: template.category,
    topicIds: [...(template.topicIds || [])],
    keywords: [...(template.keywords || [])],
    summary: template.summary,
    cues: [...(template.cues || [])],
    steps: [...(template.steps || [])],
    pitfalls: [...(template.pitfalls || [])],
    examples: runtimeTemplate.examples,
    figure: runtimeTemplate.figure,
  };
  return {
    value,
    hash: crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  };
}

function buildReviewMeta(record) {
  return getContentReviewMeta('english', {
    reviewedAt: '2026-08-10',
    sourceLabel: '义务教育英语课程标准（2022年版）与人教版新版教材公开资料（稳定方法模板复核）',
    sourceRefs: SOURCE_REFS,
    reviewScope: 'stable-method-template',
    reviewBatch: 'v1.9.9',
    evidence: [...COMMON_EVIDENCE],
    checkedTitle: record.checkedTitle,
    checkedCategory: record.checkedCategory,
    checkedTopicIds: [...record.checkedTopicIds],
    snapshotHash: record.snapshotHash,
    runtimeExampleCount: record.runtimeExampleCount,
    figureSource: record.figureSource,
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getEnglishTemplateReviewMeta(templateId) {
  const record = TEMPLATE_REVIEW_RECORDS[templateId];
  return record ? clone(buildReviewMeta(record)) : null;
}

module.exports = {
  REVIEWED_ENGLISH_TEMPLATE_IDS,
  TEMPLATE_REVIEW_RECORDS,
  SOURCE_REFS,
  buildEnglishTemplateReviewSnapshot,
  getEnglishTemplateReviewMeta,
};
