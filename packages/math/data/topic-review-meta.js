const { getContentReviewMeta } = require('./content-review-meta');

const REVIEWED_MATH_TOPIC_IDS = [
  'g7-topic-rational',
  'g7-topic-expression',
  'g7-topic-linear-equation',
  'g7-topic-basic-geometry',
  'g7-topic-parallel',
  'g7-topic-real-number',
  'g7-topic-coordinate',
  'g7-topic-system',
  'g7-topic-inequality',
  'g7-topic-statistics',
  'g8-topic-triangle',
  'g8-topic-congruent',
  'g8-topic-symmetry',
  'g8-topic-polynomial',
  'g8-topic-fraction',
  'g8-topic-radical',
  'g8-topic-pythagorean',
  'g8-topic-parallelogram',
  'g8-topic-linear-function',
  'g8-topic-data-analysis',
  'g9-topic-quadratic-equation',
  'g9-topic-quadratic-function',
  'g9-topic-rotation',
  'g9-topic-circle',
  'g9-topic-probability',
  'g9-topic-inverse-function',
  'g9-topic-similarity',
  'g9-topic-trigonometry',
  'g9-topic-projection',
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
  '专题标题、年级和稳定专题 ID 逐项核对',
  '专题与章节父级映射、核心字段和搜索入口逐项核对',
  '复核范围、官方来源和新版章序边界已登记',
];

const TOPIC_REVIEW_RECORDS = {
  'g7-topic-rational': { checkedTitle: '有理数与运算', checkedGradeId: 'grade7', checkedChapterIds: ['ch01-rational'], snapshotHash: '3b81194c67026bc9871c49c5178c28599299e6425b3db0699550e0c81298d1df' },
  'g7-topic-expression': { checkedTitle: '整式与代数式', checkedGradeId: 'grade7', checkedChapterIds: ['ch02-expression'], snapshotHash: '5bf65f5437d2816051878b4d9c57482718d80df00b8f7f98c88eee1795f3db61' },
  'g7-topic-linear-equation': { checkedTitle: '一元一次方程', checkedGradeId: 'grade7', checkedChapterIds: ['ch03-linear-equation'], snapshotHash: 'eb995754a39d7cd30bde07efa40161fae996c92961f2ff54a102b7612db4d153' },
  'g7-topic-basic-geometry': { checkedTitle: '几何图形初步', checkedGradeId: 'grade7', checkedChapterIds: ['ch04-basic-geometry'], snapshotHash: '9564ef80399f620254f09937c299b5fcb5680f64d8306969868e1d6814d7b8b2' },
  'g7-topic-parallel': { checkedTitle: '相交线与平行线', checkedGradeId: 'grade7', checkedChapterIds: ['ch05-parallel'], snapshotHash: 'a58353de776aeb6f4f24415a474567f40f12375921fb8cb4f8c12c6d5e86ace4' },
  'g7-topic-real-number': { checkedTitle: '实数', checkedGradeId: 'grade7', checkedChapterIds: ['ch06-real'], snapshotHash: 'fa2b5d645196b5aa757350d88643077d861a7487b302ad8e2aa635c64105bf3d' },
  'g7-topic-coordinate': { checkedTitle: '平面直角坐标系', checkedGradeId: 'grade7', checkedChapterIds: ['ch07-coordinate'], snapshotHash: '132667c47dbab8d418d5b160ddacbf107a44a41ae7949d49543ad7a2108b80e1' },
  'g7-topic-system': { checkedTitle: '方程组', checkedGradeId: 'grade7', checkedChapterIds: ['ch08-system'], snapshotHash: 'a07df548b96d2911976caa062420a2d178a19832c3d51b5495437e8c02b60133' },
  'g7-topic-inequality': { checkedTitle: '不等式', checkedGradeId: 'grade7', checkedChapterIds: ['ch09-inequality'], snapshotHash: '29426916f2a34e34bb1cafb7fd594574133ba967b54315541b940e74d933db88' },
  'g7-topic-statistics': { checkedTitle: '数据收集整理', checkedGradeId: 'grade7', checkedChapterIds: ['ch10-statistics'], snapshotHash: '6bee65bc9729cce5376db1c61fb5f4b464ddfda3316d2897a7fd17b53a1e2288' },
  'g8-topic-triangle': { checkedTitle: '三角形', checkedGradeId: 'grade8', checkedChapterIds: ['ch11-triangle'], snapshotHash: 'dca95f3d2bf9b3a7e9c9d34ef254c665e1e39315ff124e7f814a9745aed946a6' },
  'g8-topic-congruent': { checkedTitle: '全等三角形', checkedGradeId: 'grade8', checkedChapterIds: ['ch12-congruent'], snapshotHash: '307c959a38600bc4aaaafdbbbcb9c5dc5cefbd6e947b65fb6f04f0f8582dda1e' },
  'g8-topic-symmetry': { checkedTitle: '轴对称', checkedGradeId: 'grade8', checkedChapterIds: ['ch13-symmetry'], snapshotHash: 'ac0b6844973a6b2955ab86ee1e7d384d1b0495f3fd5f900a3bb971066c1043bf' },
  'g8-topic-polynomial': { checkedTitle: '整式乘法与因式分解', checkedGradeId: 'grade8', checkedChapterIds: ['ch14-polynomial'], snapshotHash: '72d51a2d26b3d681488ad473de4f90cd655ba728042c5acd7d4fd4d302407e5b' },
  'g8-topic-fraction': { checkedTitle: '分式', checkedGradeId: 'grade8', checkedChapterIds: ['ch15-fraction'], snapshotHash: 'a10f260d3ac2eaeaa7c2ed8639362c836c82dc1b6703fe73988c60ccb43bbd06' },
  'g8-topic-radical': { checkedTitle: '二次根式', checkedGradeId: 'grade8', checkedChapterIds: ['ch16-radical'], snapshotHash: '05e78a257d957c3cff59b1857727165e424e18d810440c02f5b7d387fae41c97' },
  'g8-topic-pythagorean': { checkedTitle: '勾股定理', checkedGradeId: 'grade8', checkedChapterIds: ['ch17-pythagorean'], snapshotHash: '9ba3b3fdaaa72f8c1c5c39ff36b667720d2e906e7cff8b72890c08188bff8ae6' },
  'g8-topic-parallelogram': { checkedTitle: '平行四边形', checkedGradeId: 'grade8', checkedChapterIds: ['ch18-parallelogram'], snapshotHash: '859fec284d2794542aa655b51c644df9434e622b316ed097dbb804a02e50994a' },
  'g8-topic-linear-function': { checkedTitle: '一次函数', checkedGradeId: 'grade8', checkedChapterIds: ['ch19-linear-function'], snapshotHash: 'e236182cc74ab8b79037b2e8dca8f342d45e5bb9d8db3dacfb6df122c62e6832', scopeNote: '仅复核稳定专题与当前章节映射，不替代新版逐册目录映射' },
  'g8-topic-data-analysis': { checkedTitle: '数据的分析', checkedGradeId: 'grade8', checkedChapterIds: ['ch20-data-analysis'], snapshotHash: 'd016ee7512994e2ec3d9c50db3672d70db6c5815122768a6391f37607dafb463', scopeNote: '仅复核稳定专题与当前章节映射，不替代新版逐册目录映射' },
  'g9-topic-quadratic-equation': { checkedTitle: '一元二次方程', checkedGradeId: 'grade9', checkedChapterIds: ['ch21-quadratic-equation'], snapshotHash: '55a6c55088f9383d47d2a146985210ff70be569f508d6a5cac8cef3179a4a807' },
  'g9-topic-quadratic-function': { checkedTitle: '二次函数', checkedGradeId: 'grade9', checkedChapterIds: ['ch22-quadratic-function'], snapshotHash: '3953112fe59ec5959ce408f85dda554cff04363bb0f9485f670cc394fb9d53d5' },
  'g9-topic-rotation': { checkedTitle: '旋转', checkedGradeId: 'grade9', checkedChapterIds: ['ch23-rotation'], snapshotHash: '2f090ee2bb6f8c1100bb9fd8dc324c4aaf4f475275048ce58e629423719c0477' },
  'g9-topic-circle': { checkedTitle: '圆', checkedGradeId: 'grade9', checkedChapterIds: ['ch24-circle'], snapshotHash: '8fdd16dd0512243d6d15786a9596393b2224748f9ae64a74e165e48000e7bc40' },
  'g9-topic-probability': { checkedTitle: '概率', checkedGradeId: 'grade9', checkedChapterIds: ['ch25-probability'], snapshotHash: 'f3e5f466787cf9dd5d78e1dcfc8b44790b8bb96edf5b92ed99b280c86e81bd95' },
  'g9-topic-inverse-function': { checkedTitle: '反比例函数', checkedGradeId: 'grade9', checkedChapterIds: ['ch26-inverse-function'], snapshotHash: '4ff17c2a400ce2e49c7f8c0f32bb39dce3a1a94b906c74efb3099a0603d1d4f7' },
  'g9-topic-similarity': { checkedTitle: '相似', checkedGradeId: 'grade9', checkedChapterIds: ['ch27-similarity'], snapshotHash: '643e6bf77cb09a89aa863506dbf457d36174f7dd3ff8ed1af73e68353fd37f24' },
  'g9-topic-trigonometry': { checkedTitle: '锐角三角函数', checkedGradeId: 'grade9', checkedChapterIds: ['ch28-trigonometry'], snapshotHash: 'f87288b357d6c2bb432bea4044f5f34d78d1bb5daa64ac076081e0d441319926' },
  'g9-topic-projection': { checkedTitle: '投影与视图', checkedGradeId: 'grade9', checkedChapterIds: ['ch29-projection'], snapshotHash: 'cf2c259b6be6fa480537008ef9721994d4dc678f2424fe195cb5c4a93373eda5' },
};

function buildTopicReviewSnapshot(topic) {
  // 复核快照只在构建/校验脚本中执行，避免小程序包加载 Node 内置模块。
  const crypto = require('crypto');
  const value = {
    title: topic.title,
    gradeId: topic.gradeId,
    chapterIds: [...topic.chapterIds],
    summary: topic.summary,
    focus: [...(topic.focus || [])],
    signals: [...(topic.signals || [])],
    checkpointTitles: (topic.checkpoints || []).map((item) => item.title),
  };
  return {
    value,
    hash: crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  };
}

function buildReviewMeta(record) {
  return getContentReviewMeta('math', {
    reviewedAt: '2026-08-10',
    sourceLabel: '义务教育数学课程标准（2022年版）与人教版新版教材公开资料（稳定专题复核）',
    sourceRefs: SOURCE_REFS,
    reviewScope: 'stable-topic-container',
    reviewBatch: 'v1.9.5',
    evidence: [...COMMON_EVIDENCE],
    ...(record.scopeNote ? { scopeNote: record.scopeNote } : {}),
  });
}

function getTopicReviewMeta(topicId) {
  const record = TOPIC_REVIEW_RECORDS[topicId];
  return record ? buildReviewMeta(record) : null;
}

module.exports = {
  REVIEWED_MATH_TOPIC_IDS,
  TOPIC_REVIEW_RECORDS,
  SOURCE_REFS,
  buildTopicReviewSnapshot,
  getTopicReviewMeta,
};
