const { getContentReviewMeta } = require('./content-review-meta');

const REVIEWED_PHYSICS_TOPIC_IDS = [
  'phy-topic-motion-sound',
  'phy-topic-light',
  'phy-topic-matter',
  'phy-topic-force',
  'phy-topic-energy',
  'phy-topic-electricity',
];

const SOURCE_REFS = [
  {
    key: 'moe-physics-2022',
    title: '义务教育物理课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
  },
  {
    key: 'pep-physics-public',
    title: '人教版初中物理新教材介绍',
    url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240925_1995627.html',
  },
];

const COMMON_EVIDENCE = [
  '专题标题、适用年级和稳定专题 ID 逐项核对',
  '知识点/方法模板父级、公式或实验入口、物理图示和搜索入口逐项核对',
  '复核范围、官方来源和人工复核记录已登记',
];

const TOPIC_REVIEW_RECORDS = {
  'phy-topic-motion-sound': {
    checkedTitle: '运动与声音',
    checkedGradeBands: ['八年级基础', '九年级复习'],
    checkedKnowledgeIds: ['phy-motion-reference-speed', 'phy-motion-graph', 'phy-sound-basics'],
    checkedTemplateIds: ['phy-template-motion-graph'],
    snapshotHash: 'acb1f99a8a0a9b7b7b142ca761cf479bb756469cf69edb716afc8d5db2d7a9dc',
  },
  'phy-topic-light': {
    checkedTitle: '光现象与成像',
    checkedGradeBands: ['八年级基础', '九年级复习'],
    checkedKnowledgeIds: ['phy-light-reflection-refraction', 'phy-light-plane-mirror', 'phy-light-lens'],
    checkedTemplateIds: ['phy-template-ray-diagram'],
    snapshotHash: 'a573a2ebe432e0c22c2a7fe9c7d867e6cd273537d238a560d4704908dce4b6aa',
  },
  'phy-topic-matter': {
    checkedTitle: '热现象与物质测量',
    checkedGradeBands: ['八年级基础', '九年级复习'],
    checkedKnowledgeIds: ['phy-matter-temperature-change', 'phy-matter-mass-density', 'phy-matter-density-measurement'],
    checkedTemplateIds: ['phy-template-density-lab'],
    snapshotHash: '4656e035da0add1681fa90c5a5a7c30bbeb2268ceeaee02c63b1f5cc31d44cf1',
  },
  'phy-topic-force': {
    checkedTitle: '力与流体',
    checkedGradeBands: ['八年级重点', '九年级综合'],
    checkedKnowledgeIds: ['phy-force-diagram-balance', 'phy-force-pressure', 'phy-force-buoyancy'],
    checkedTemplateIds: ['phy-template-force-analysis'],
    snapshotHash: '081bde27a83fa1e8bb4aae3695a692419b5866919d19f6bee52d729ba72595b3',
  },
  'phy-topic-energy': {
    checkedTitle: '功与能量',
    checkedGradeBands: ['八年级进阶', '九年级重点'],
    checkedKnowledgeIds: ['phy-energy-work-power', 'phy-energy-machine-efficiency', 'phy-energy-conversion'],
    checkedTemplateIds: ['phy-template-energy-flow'],
    snapshotHash: '65f56f16b74729357cdd02056c6995c044b5fe3c458e5b880d565346388dd6c8',
  },
  'phy-topic-electricity': {
    checkedTitle: '电学与电磁现象',
    checkedGradeBands: ['九年级重点', '中考综合'],
    checkedKnowledgeIds: ['phy-electric-circuit-meter', 'phy-electric-ohm-law', 'phy-electric-power-magnetism'],
    checkedTemplateIds: ['phy-template-circuit-analysis'],
    snapshotHash: 'fc6c93d1091a552704f1f8158fb15e70b0c1e16054624dc1566a6f2ab989ddb1',
  },
};

function buildPhysicsTopicReviewSnapshot(topic) {
  // 复核快照只在构建/校验脚本中执行，避免小程序包加载 Node 内置模块。
  const crypto = require('crypto');
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
  return getContentReviewMeta('physics', {
    reviewedAt: '2026-08-10',
    sourceLabel: '义务教育物理课程标准（2022年版）与人教版新版教材公开资料（稳定专题复核）',
    sourceRefs: SOURCE_REFS,
    reviewScope: 'stable-topic-container',
    reviewBatch: 'v1.9.8',
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

function getPhysicsTopicReviewMeta(topicId) {
  const record = TOPIC_REVIEW_RECORDS[topicId];
  return record ? clone(buildReviewMeta(record)) : null;
}

module.exports = {
  REVIEWED_PHYSICS_TOPIC_IDS,
  TOPIC_REVIEW_RECORDS,
  SOURCE_REFS,
  buildPhysicsTopicReviewSnapshot,
  getPhysicsTopicReviewMeta,
};
