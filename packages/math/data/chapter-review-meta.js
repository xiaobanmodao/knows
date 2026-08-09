const { getContentReviewMeta } = require('./content-review-meta');

const REVIEWED_MATH_CHAPTER_IDS = [
  'ch01-rational',
  'ch02-expression',
  'ch03-linear-equation',
  'ch04-basic-geometry',
  'ch05-parallel',
  'ch06-real',
  'ch07-coordinate',
  'ch08-system',
  'ch09-inequality',
  'ch10-statistics',
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
  '章节标题与当前稳定章节 ID 逐项核对',
  '官方小节标签与当前知识入口逐项核对',
  '复核范围、来源和新版章序边界已登记',
];

const CHAPTER_REVIEW_RECORDS = {
  'ch01-rational': {
    checkedTitle: '有理数',
    checkedSections: ['1.1 正数和负数', '1.2 有理数', '1.3 有理数的加减法', '1.4 有理数的乘除法', '1.5 有理数的乘方'],
  },
  'ch02-expression': {
    checkedTitle: '整式的加减',
    checkedSections: ['2.1 整式', '2.2 整式的加减'],
  },
  'ch03-linear-equation': {
    checkedTitle: '一元一次方程',
    checkedSections: ['3.1 从算式到方程', '3.2 解一元一次方程（一）——合并同类项与移项', '3.3 解一元一次方程（二）——去括号与去分母', '3.4 实际问题与一元一次方程'],
  },
  'ch04-basic-geometry': {
    checkedTitle: '几何图形初步',
    checkedSections: ['4.1 几何图形', '4.2 直线、射线、线段', '4.3 角', '4.4 课题学习 设计制作长方体形状的包装纸盒'],
  },
  'ch05-parallel': {
    checkedTitle: '相交线与平行线',
    checkedSections: ['5.1 相交线', '5.2 平行线及其判定', '5.3 平行线的性质', '5.4 平移'],
  },
  'ch06-real': {
    checkedTitle: '实数',
    checkedSections: ['6.1 平方根', '6.2 立方根', '6.3 实数'],
  },
  'ch07-coordinate': {
    checkedTitle: '平面直角坐标系',
    checkedSections: ['7.1 平面直角坐标系', '7.2 坐标方法的简单应用'],
  },
  'ch08-system': {
    checkedTitle: '二元一次方程组',
    checkedSections: ['8.1 二元一次方程组', '8.2 消元——解二元一次方程组', '8.3 实际问题与二元一次方程组', '8.4 三元一次方程组的解法'],
  },
  'ch09-inequality': {
    checkedTitle: '不等式与不等式组',
    checkedSections: ['9.1 不等式', '9.2 一元一次不等式', '9.3 一元一次不等式组'],
  },
  'ch10-statistics': {
    checkedTitle: '数据的收集、整理与描述',
    checkedSections: ['10.1 统计调查', '10.2 直方图', '10.3 课题学习 从数据谈节水'],
  },
};

function buildReviewMeta(record) {
  return getContentReviewMeta('math', {
    reviewedAt: '2026-08-10',
    sourceLabel: '义务教育数学课程标准（2022年版）与人教版新版教材公开资料（稳定容器复核）',
    sourceRefs: SOURCE_REFS,
    reviewScope: 'stable-container',
    checkedTitle: record.checkedTitle,
    checkedSections: [...record.checkedSections],
    evidence: [...COMMON_EVIDENCE],
  });
}

function getChapterReviewMeta(chapterId) {
  const record = CHAPTER_REVIEW_RECORDS[chapterId];
  return record ? buildReviewMeta(record) : null;
}

module.exports = {
  REVIEWED_MATH_CHAPTER_IDS,
  CHAPTER_REVIEW_RECORDS,
  SOURCE_REFS,
  getChapterReviewMeta,
};
