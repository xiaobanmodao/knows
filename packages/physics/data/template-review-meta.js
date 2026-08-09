const { getContentReviewMeta } = require('./content-review-meta');

const REVIEWED_PHYSICS_TEMPLATE_IDS = [
  'phy-template-ch01-motion',
  'phy-template-ch02-sound',
  'phy-template-ch03-state',
  'phy-template-ch04-light',
  'phy-template-ch05-lens',
  'phy-template-ch06-density',
  'phy-template-ch07-force',
  'phy-template-ch08-balance',
  'phy-template-ch09-pressure',
  'phy-template-ch10-buoyancy',
  'phy-template-ch11-work-energy',
  'phy-template-ch12-machines',
  'phy-template-ch13-thermal',
  'phy-template-ch14-engine',
  'phy-template-ch15-circuit',
  'phy-template-ch16-voltage',
  'phy-template-ch17-ohm',
  'phy-template-ch18-power',
  'phy-template-ch19-safety',
  'phy-template-ch20-electromagnetism',
  'phy-template-ch21-information',
  'phy-template-ch22-energy',
  'phy-template-motion-graph',
  'phy-template-ray-diagram',
  'phy-template-density-lab',
  'phy-template-force-analysis',
  'phy-template-energy-flow',
  'phy-template-circuit-analysis',
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
  '模板标题、分类、稳定 ID 和章节/专题父级逐项核对',
  '适用信号、方法步骤、易错边界、物理示例和图示入口逐项核对',
  '复核范围、官方来源、公式/单位/方向或实验边界和人工复核记录已登记',
];

const TEMPLATE_REVIEW_RECORDS = {
  'phy-template-ch01-motion': { checkedTitle: '机械运动四步分析法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch01-motion'], snapshotHash: '601a77be91e762569d72519ee74421ce15530e5632fbbc410e6607d1e9a9135e', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch02-sound': { checkedTitle: '声现象因果对应法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch02-sound'], snapshotHash: '0cdbfe1df1c7af9bb868d3e4b70fb8618a4340fab44dfd7e0c12b31bbb8cc3f0', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch03-state': { checkedTitle: '物态变化状态箭头法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch03-state-change'], snapshotHash: 'a7e8dd67bb2efdc915ec1ec72d1e9c7c6bc07ebc69e9beaeb63cdf5ec86c10b1', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch04-light': { checkedTitle: '光路图基准线作图法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch04-light'], snapshotHash: 'cbdf0bc040de2c808cd7d19208efac3ba6303a23075618ac251997d8293f1014', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch05-lens': { checkedTitle: '凸透镜成像区间判断法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch05-lens'], snapshotHash: '27276e8e7923416a2fa7afa136609df58bc3f1fb99b9e0060e5ceb3aa5fa50d0', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch06-density': { checkedTitle: '密度实验与计算闭环', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch06-mass-density'], snapshotHash: '9e550904f7de25ddcbb3363114c30832334d84f4da18c8d3d8c7dbbfd86adc8b', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch07-force': { checkedTitle: '力的示意图三要素法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch07-force'], snapshotHash: 'f088adbac8aa5bed7d3bd3858cbc6ce8119bc1dc728d2425203ba8ff5e5d9eb8', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch08-balance': { checkedTitle: '运动状态反推合力法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch08-motion-force'], snapshotHash: 'c7553140a592ce8ae6ff58de43a09c6e12e111512b4dcb731f86c0a74088e023', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch09-pressure': { checkedTitle: '压强对象面积深度法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch09-pressure'], snapshotHash: '50e10ca551aea395fb8d1bcd57ea9b8dbe629893e35962d8960e62dc9aea55a9', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch10-buoyancy': { checkedTitle: '浮力状态公式选择法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch10-buoyancy'], snapshotHash: 'cec91ba4236513bcd2f6d621f728df0841f950c4ab5416066d34784b6816698a', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch11-work-energy': { checkedTitle: '功与机械能状态变化法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch11-work-energy'], snapshotHash: 'c2dc4e8d39ba8da604c32cbdd5e51636e204c92cb9c186158624580b3eb7e6e0', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch12-machines': { checkedTitle: '简单机械几何受力法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch12-simple-machines'], snapshotHash: 'd1015aab6f0b3d5b71f146dcc87c299df333f9e7e0f994ef2a55e34220579937', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch13-thermal': { checkedTitle: '热学对象过程公式法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch13-internal-energy'], snapshotHash: '2b40bdb3c76bb80e077734ff161eeac1a17f9f9ef6f6c6a79a71ee7d229a0195', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch14-engine': { checkedTitle: '热机能量流向法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch14-heat-engine'], snapshotHash: 'ad38a34ce6fdf0ad362419b9d2a0f5e96b437068604951c88b71cdea675662b6', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch15-circuit': { checkedTitle: '电路节点电流路径法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch15-current-circuit'], snapshotHash: 'daa8a15437bacb03181d695dc8fbdffd8cadcb6cd29a6029333dd59949310995', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch16-voltage': { checkedTitle: '电压节点与变阻器接入法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch16-voltage-resistance'], snapshotHash: 'a08b907383ac9382b3fc986e36985691f658c62d26242223acbc56a7d08385c7', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch17-ohm': { checkedTitle: '欧姆定律同体同态法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch17-ohm-law'], snapshotHash: 'edd9327ec3583ff0efec8669b183e93830d2b58d9aa99f213c6b7ab8d46cc73e', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch18-power': { checkedTitle: '额定实际状态分离法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch18-electric-power'], snapshotHash: '82a32cd9d26f05ba073422c6c9fa832d96f35bed279c7093a85d91938032a0bd', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch19-safety': { checkedTitle: '家庭电路故障安全排查法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch19-household-electricity'], snapshotHash: 'e1eae5a42410f60802949b86b8ef8d87ab1a2a274475469774d388f144d47b92', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch20-electromagnetism': { checkedTitle: '电磁三方向与能量法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch20-electric-magnetism'], snapshotHash: '5ce1552edcb7783d4239eed814c79930335a48472032eb3edd788d2bfa31a139', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch21-information': { checkedTitle: '通信链路分段法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch21-information'], snapshotHash: 'b3e6722790b1864c7fe441dd4dcc040f47921195ea5dbc02dd65f900b51e0358', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ch22-energy': { checkedTitle: '能源方案多维评价法', checkedCategory: '物理方法', parentType: 'chapter', checkedParentIds: ['phy-ch22-energy'], snapshotHash: '1c0d7d3c1e68ca89e77ab5d9a01544dd30cc1c3d932a27b2d7b342e63d7a645c', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-motion-graph': { checkedTitle: '运动过程四步分析法', checkedCategory: '计算与图像', parentType: 'topic', checkedParentIds: ['phy-topic-motion-sound'], snapshotHash: 'cf47b47d61a69e2f3c839dd373917046ae2e780a984a6d4030f9aa9f1e14da9e', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-ray-diagram': { checkedTitle: '光路图规范作图法', checkedCategory: '作图', parentType: 'topic', checkedParentIds: ['phy-topic-light'], snapshotHash: '138f3ed4c5438da546a0f6b636de42fe82ef04664a5d6cf80029ba0e790f76a3', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-density-lab': { checkedTitle: '密度测量实验流程', checkedCategory: '实验与计算', parentType: 'topic', checkedParentIds: ['phy-topic-matter'], snapshotHash: 'b07f73599605c5e7c2098c1b71f1e9d3aa610a7427cfd956ce39fb4fc614bf49', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-force-analysis': { checkedTitle: '受力分析与浮力五步法', checkedCategory: '作图与计算', parentType: 'topic', checkedParentIds: ['phy-topic-force'], snapshotHash: 'f47cdb12bec5d364f0116303bfe0c073be2e3cab62b952e934e8c1f35fec197c', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-energy-flow': { checkedTitle: '功与能量流向分析法', checkedCategory: '计算与综合', parentType: 'topic', checkedParentIds: ['phy-topic-energy'], snapshotHash: 'f536f18977db2eaef80d00c0a20c937dfd225a2ade0bd81b49a1526a12d74094', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
  'phy-template-circuit-analysis': { checkedTitle: '动态电路四步分析法', checkedCategory: '电路与计算', parentType: 'topic', checkedParentIds: ['phy-topic-electricity'], snapshotHash: '09bfd275b456c8dcc0848b5bf06876319445a7275d5650618faba9f1e37f1662', runtimeExampleCount: 3, figureSource: 'shared-generated-asset' },
};

function buildPhysicsTemplateReviewSnapshot(template, runtimeTemplate) {
  // 复核快照只在构建/校验脚本中执行，避免小程序包加载 Node 内置模块。
  const crypto = require('crypto');
  const value = {
    id: template.id,
    name: template.name,
    category: template.category,
    chapterIds: [...(template.chapterIds || [])],
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
  return getContentReviewMeta('physics', {
    reviewedAt: '2026-08-10',
    sourceLabel: '义务教育物理课程标准（2022年版）与人教版新版教材公开资料（稳定方法模板复核）',
    sourceRefs: SOURCE_REFS,
    reviewScope: 'stable-method-template',
    reviewBatch: 'v1.10.0',
    evidence: [...COMMON_EVIDENCE],
    checkedTitle: record.checkedTitle,
    checkedCategory: record.checkedCategory,
    parentType: record.parentType,
    checkedParentIds: [...record.checkedParentIds],
    snapshotHash: record.snapshotHash,
    runtimeExampleCount: record.runtimeExampleCount,
    figureSource: record.figureSource,
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getPhysicsTemplateReviewMeta(templateId) {
  const record = TEMPLATE_REVIEW_RECORDS[templateId];
  return record ? clone(buildReviewMeta(record)) : null;
}

module.exports = {
  REVIEWED_PHYSICS_TEMPLATE_IDS,
  TEMPLATE_REVIEW_RECORDS,
  SOURCE_REFS,
  buildPhysicsTemplateReviewSnapshot,
  getPhysicsTemplateReviewMeta,
};
