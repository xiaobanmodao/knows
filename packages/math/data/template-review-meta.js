const { getContentReviewMeta } = require('./content-review-meta');

const REVIEWED_MATH_TEMPLATE_IDS = [
  'model-hand-in-hand',
  'model-general-meets-horse',
  'model-a-similarity',
  'model-k-similarity',
  'model-angle-bisector',
  'model-midpoint',
  'model-square',
  'model-tangent',
  'model-pythagorean-shortest',
  'model-undetermined-coeff',
  'model-completing-square',
  'model-classification',
  'model-function-extreme',
  'model-sine-cosine',
  'model-visualization',
  'model-cross',
  'model-eight-shape',
  'model-dart',
  'model-child-mother',
  'model-k-equal-angle',
  'model-pig-hoof',
  'model-round-helper',
  'model-midline-extension',
  'model-number-line-distance',
  'model-expression-structure',
  'model-linear-equation-scenario',
  'model-line-angle-calculation',
  'model-root-estimation',
  'model-coordinate-translation',
  'model-system-elimination',
  'model-survey-chart',
  'model-factorization',
  'model-fraction-equation',
  'model-radical-operation',
  'model-statistic-selection',
  'model-probability-listing',
];

const SOURCE_REFS = [
  {
    key: 'moe-math-curriculum-2022',
    title: '义务教育数学课程标准（2022年版）',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf',
  },
  {
    key: 'pep-math-new-textbook-2024',
    title: '人教版义务教育数学（七至九年级）新教材介绍',
    url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202408/t20240826_1994351.html',
  },
];

const COMMON_EVIDENCE = [
  '模板标题、分类、稳定 ID 和章节父级逐项核对',
  '适用信号、方法步骤、易错边界、运行时示例和图示入口逐项核对',
  '复核范围、官方来源、共享图示边界和新版章序边界已登记',
];

const TEMPLATE_REVIEW_RECORDS = {
  'model-hand-in-hand': { checkedTitle: '手拉手模型', checkedCategory: '几何证明', checkedChapterIds: ['ch12-congruent', 'ch23-rotation', 'ch27-similarity'], snapshotHash: '869d7b77dce7f9eaa39d67cd876182d25843f212031469af0883bcd72b896b7a', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-general-meets-horse': { checkedTitle: '将军饮马模型', checkedCategory: '最短路径', checkedChapterIds: ['ch13-symmetry', 'ch17-pythagorean', 'ch19-linear-function'], snapshotHash: '53516739408a298b9bd19cf8d6576d3cb2fc89066ceda91fe287bb8109f35053', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-a-similarity': { checkedTitle: 'A 型相似模型', checkedCategory: '相似三角形', checkedChapterIds: ['ch11-triangle', 'ch27-similarity'], snapshotHash: 'f858a4e3ef2b855f35a827fdd475ebf43a45cbe9ef22b3f233127bb743dbffa6', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-k-similarity': { checkedTitle: 'K 型相似模型', checkedCategory: '相似三角形', checkedChapterIds: ['ch05-parallel', 'ch27-similarity'], snapshotHash: 'c4a9c8f09712df4b9a73ee65ca082575a4d4683784c6079d51ecdf935b76e5fa', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-angle-bisector': { checkedTitle: '角平分线模型', checkedCategory: '几何证明', checkedChapterIds: ['ch12-congruent', 'ch24-circle', 'ch27-similarity'], snapshotHash: '843795bdde19714efc061920f1705388d373bef1191c9f15671cb0001e1ff6c7', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-midpoint': { checkedTitle: '中点与中位线模型', checkedCategory: '几何证明', checkedChapterIds: ['ch11-triangle', 'ch18-parallelogram', 'ch27-similarity'], snapshotHash: '18ac5ce8a521985d1ad83e357331d67a9348c249d5791c5ce9ff1db3e088d570', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-square': { checkedTitle: '正方形模型', checkedCategory: '四边形模型', checkedChapterIds: ['ch18-parallelogram', 'ch23-rotation'], snapshotHash: '63262fd97add0f7663f3a734110f9c037b30fb1e18ff86e0cfec464edfbe7d7e', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-tangent': { checkedTitle: '切线判定与性质模型', checkedCategory: '圆几何', checkedChapterIds: ['ch24-circle'], snapshotHash: '17365a04ad7fcefececd47836c527da6db3bda2a79605f187f231b00cf3af384', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-pythagorean-shortest': { checkedTitle: '勾股最短路模型', checkedCategory: '几何计算', checkedChapterIds: ['ch17-pythagorean', 'ch28-trigonometry'], snapshotHash: 'cab8f94e27ba27d194c1743fb80bf5a7cd5900ad5eca3b6cc830b8dfa62d82c6', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-undetermined-coeff': { checkedTitle: '待定系数法', checkedCategory: '函数与代数', checkedChapterIds: ['ch19-linear-function', 'ch22-quadratic-function', 'ch26-inverse-function'], snapshotHash: '9ac5076a016b36fcf0cf186a984b0b1afe4f4a91fba8c9d8a35dc4b3fe6628b9', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-completing-square': { checkedTitle: '配方法模板', checkedCategory: '方程与函数', checkedChapterIds: ['ch21-quadratic-equation', 'ch22-quadratic-function'], snapshotHash: '14a812c4884e35dbfbac619b04695918bd319867e0b39ec677821197ede5815c', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-classification': { checkedTitle: '分类讨论模型', checkedCategory: '通用策略', checkedChapterIds: ['ch09-inequality', 'ch21-quadratic-equation', 'ch26-inverse-function'], snapshotHash: '80033a23b032e117abee6bd8aca19b7e3afbe5b0795d083a4174b5bdb33bec2b', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-function-extreme': { checkedTitle: '函数最值模型', checkedCategory: '函数压轴', checkedChapterIds: ['ch19-linear-function', 'ch22-quadratic-function', 'ch26-inverse-function'], snapshotHash: '82c58144e02feebc34c15f53827e5a29ab5e4418895ed08e4a9da7588295b8db', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-sine-cosine': { checkedTitle: '解直角三角形模型', checkedCategory: '三角函数', checkedChapterIds: ['ch28-trigonometry'], snapshotHash: 'de1ab512f4813b2581179acf1ef512c6ea2ce2b996550edaa7dba1a2c6a540ae', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-visualization': { checkedTitle: '三视图与展开图模型', checkedCategory: '空间想象', checkedChapterIds: ['ch29-projection'], snapshotHash: '272b1749f54d5f6d020061c34a00bb154861521381bc75be188d88560a7c1504', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-cross': { checkedTitle: '十字架模型', checkedCategory: '四边形与相似', checkedChapterIds: ['ch17-pythagorean', 'ch18-parallelogram', 'ch27-similarity'], snapshotHash: '6a3a79dceb0ae7b26d09c3211ecb9585bb25d416949dc9425deb34b5c2225f38', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-eight-shape': { checkedTitle: '8字模型', checkedCategory: '相似三角形', checkedChapterIds: ['ch05-parallel', 'ch12-congruent', 'ch27-similarity'], snapshotHash: '50621a12bceb5b394d4fc4f5ea1bfbbc9a873cb515701889c77b2af70cd1ecae', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-dart': { checkedTitle: '飞镖模型', checkedCategory: '角与相似', checkedChapterIds: ['ch12-congruent', 'ch13-symmetry', 'ch27-similarity'], snapshotHash: '0596dc0ee8162464febea3722382cdafc591e5a3ed17e9d004006d40627b351a', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-child-mother': { checkedTitle: '子母型相似', checkedCategory: '相似三角形', checkedChapterIds: ['ch11-triangle', 'ch27-similarity'], snapshotHash: 'd8b8301234c055ce953534243c966cbe88b2c67eb1344b629e4e88e9c889e195', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-k-equal-angle': { checkedTitle: '一线三等角模型', checkedCategory: '相似三角形', checkedChapterIds: ['ch05-parallel', 'ch19-linear-function', 'ch27-similarity'], snapshotHash: '6112ac930df47e99cc246ab416bed2ae0fb8f3addac858e39af685ed29ba0994', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-pig-hoof': { checkedTitle: '猪蹄模型', checkedCategory: '平行线与角', checkedChapterIds: ['ch05-parallel', 'ch11-triangle', 'ch13-symmetry'], snapshotHash: 'e3c5d344a97768d49ce1a11aaf1b15250d3268eb746df10b8d9b5f9043a063e1', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-round-helper': { checkedTitle: '圆辅助线模型', checkedCategory: '圆几何', checkedChapterIds: ['ch24-circle'], snapshotHash: '86ad2b172637daff8a5fecb1ef11658ae8776626069899a121adfd24ed8c0f2a', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-midline-extension': { checkedTitle: '倍长中线模型', checkedCategory: '三角形辅助线', checkedChapterIds: ['ch11-triangle', 'ch18-parallelogram', 'ch27-similarity'], snapshotHash: '9d8b98159c0629a006607d02bb017d7f5fbf2c106b0deef1701a7b19457f71b7', runtimeExampleCount: 1, figureSource: 'shared-generated-asset' },
  'model-number-line-distance': { checkedTitle: '数轴距离模型', checkedCategory: '有理数与数轴', checkedChapterIds: ['ch01-rational'], snapshotHash: '9e34a01c565f70e04292d3440226933d8f7500fd3ecf08f4f7ecb1d0c831e15c', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-expression-structure': { checkedTitle: '整式结构化简', checkedCategory: '整式与代数式', checkedChapterIds: ['ch02-expression'], snapshotHash: '22d33276551916bf37266f0cd77527d72b33d9e29757f2e03ce66c41ddeb82f9', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-linear-equation-scenario': { checkedTitle: '一元一次方程建模', checkedCategory: '方程应用', checkedChapterIds: ['ch03-linear-equation'], snapshotHash: 'c98fa63913d3d64d0dc1726616a2252f45b8be427f032e2314c1294ccff50779', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-line-angle-calculation': { checkedTitle: '线段与角计算', checkedCategory: '几何初步', checkedChapterIds: ['ch04-basic-geometry'], snapshotHash: 'a558c9388d57ccd2ab7b299f2eb859172a7f967709cae68b510e1999b53de86f', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-root-estimation': { checkedTitle: '根式估算比较', checkedCategory: '实数', checkedChapterIds: ['ch06-real'], snapshotHash: '85baad733accd3f979f81f95c04718f5b6c03faf853d355f1b20d602807d7a21', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-coordinate-translation': { checkedTitle: '坐标平移模型', checkedCategory: '平面直角坐标系', checkedChapterIds: ['ch07-coordinate'], snapshotHash: '19bd9925cfa47fc17180ac96a0959575c68f96d9214a123bb199f04585ed37ab', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-system-elimination': { checkedTitle: '方程组消元', checkedCategory: '方程组', checkedChapterIds: ['ch08-system'], snapshotHash: '5d7b11090977a29e9b0c0d45e5292b30943cd537d508db7c68161d20e6835220', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-survey-chart': { checkedTitle: '调查与频数图表', checkedCategory: '统计调查', checkedChapterIds: ['ch10-statistics'], snapshotHash: '2956c09d20122bc39b06ad4e76a6ceadba00f38f64195879a648d2533c5364b7', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-factorization': { checkedTitle: '因式分解三步法', checkedCategory: '整式乘法与分解', checkedChapterIds: ['ch14-polynomial'], snapshotHash: '4a883a20a2d50cc2897d988772f68001b129874d71ef5c2ac6a3315f3ea30c77', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-fraction-equation': { checkedTitle: '分式方程建模', checkedCategory: '分式应用', checkedChapterIds: ['ch15-fraction'], snapshotHash: '63679028e63bbc9dd7f616c2df8d5790f8b0853fcc5a9772a50212e6fce3b864', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-radical-operation': { checkedTitle: '二次根式运算', checkedCategory: '二次根式', checkedChapterIds: ['ch16-radical'], snapshotHash: '4eb4a15c905415a56fe05405fbc705a3cf78de951baf403bc62e41df7dba07ee', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-statistic-selection': { checkedTitle: '统计量选择', checkedCategory: '数据分析', checkedChapterIds: ['ch20-data-analysis'], snapshotHash: '90735337aa60eca438c3c3966f166a9084f03da56fbf9abd596f45a58dda2970', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
  'model-probability-listing': { checkedTitle: '列表与树状图概率', checkedCategory: '概率', checkedChapterIds: ['ch25-probability'], snapshotHash: '5358471cc8f694d230cd753fb21acd55de987fcb00be3f616a8ffce7e8023dda', runtimeExampleCount: 1, figureSource: 'dedicated-asset' },
};

function buildTemplateReviewSnapshot(template, runtimeTemplate) {
  // 复核快照只在构建/校验脚本中执行，避免小程序包加载 Node 内置模块。
  const crypto = require('crypto');
  const value = {
    id: template.id,
    name: template.name,
    category: template.category,
    relatedChapters: [...(template.relatedChapters || [])],
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
  const scopeNote = record.checkedChapterIds.some((id) => id === 'ch19-linear-function' || id === 'ch20-data-analysis')
    ? '仅复核稳定方法模板与当前章节映射，不替代新版逐册目录映射'
    : undefined;
  return getContentReviewMeta('math', {
    reviewedAt: '2026-08-10',
    sourceLabel: '义务教育数学课程标准（2022年版）与人教版新版教材公开资料（稳定方法模板复核）',
    sourceRefs: SOURCE_REFS,
    reviewScope: 'stable-method-template',
    reviewBatch: 'v1.9.6',
    evidence: [...COMMON_EVIDENCE],
    checkedTitle: record.checkedTitle,
    checkedCategory: record.checkedCategory,
    checkedChapterIds: [...record.checkedChapterIds],
    snapshotHash: record.snapshotHash,
    runtimeExampleCount: record.runtimeExampleCount,
    figureSource: record.figureSource,
    ...(scopeNote ? { scopeNote } : {}),
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getTemplateReviewMeta(templateId) {
  const record = TEMPLATE_REVIEW_RECORDS[templateId];
  return record ? clone(buildReviewMeta(record)) : null;
}

module.exports = {
  REVIEWED_MATH_TEMPLATE_IDS,
  TEMPLATE_REVIEW_RECORDS,
  SOURCE_REFS,
  buildTemplateReviewSnapshot,
  getTemplateReviewMeta,
};
