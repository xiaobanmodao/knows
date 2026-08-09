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
  'ch11-triangle',
  'ch12-congruent',
  'ch13-symmetry',
  'ch14-polynomial',
  'ch15-fraction',
  'ch16-radical',
  'ch17-pythagorean',
  'ch18-parallelogram',
  'ch19-linear-function',
  'ch20-data-analysis',
  'ch21-quadratic-equation',
  'ch22-quadratic-function',
  'ch23-rotation',
  'ch24-circle',
  'ch25-probability',
  'ch26-inverse-function',
  'ch27-similarity',
  'ch28-trigonometry',
  'ch29-projection',
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
  'ch11-triangle': {
    checkedTitle: '三角形',
    checkedSections: ['11.1 与三角形有关的线段', '11.2 与三角形有关的角', '11.3 多边形及其内角和'],
    reviewBatch: 'v1.9.4',
  },
  'ch12-congruent': {
    checkedTitle: '全等三角形',
    checkedSections: ['12.1 全等三角形', '12.2 三角形全等的判定', '12.3 角的平分线的性质'],
    reviewBatch: 'v1.9.4',
  },
  'ch13-symmetry': {
    checkedTitle: '轴对称',
    checkedSections: ['13.1 轴对称', '13.2 画轴对称图形', '13.3 等腰三角形', '13.4 课题学习 最短路径问题'],
    reviewBatch: 'v1.9.4',
  },
  'ch14-polynomial': {
    checkedTitle: '整式的乘法与因式分解',
    checkedSections: ['14.1 整式的乘法', '14.2 乘法公式', '14.3 因式分解'],
    reviewBatch: 'v1.9.4',
  },
  'ch15-fraction': {
    checkedTitle: '分式',
    checkedSections: ['15.1 分式', '15.2 分式的运算', '15.3 分式方程'],
    reviewBatch: 'v1.9.4',
  },
  'ch16-radical': {
    checkedTitle: '二次根式',
    checkedSections: ['16.1 二次根式', '16.2 二次根式的乘除', '16.3 二次根式的加减'],
    reviewBatch: 'v1.9.4',
  },
  'ch17-pythagorean': {
    checkedTitle: '勾股定理',
    checkedSections: ['17.1 勾股定理', '17.2 勾股定理的逆定理'],
    reviewBatch: 'v1.9.4',
  },
  'ch18-parallelogram': {
    checkedTitle: '平行四边形',
    checkedSections: ['18.1 平行四边形', '18.2 特殊的平行四边形'],
    reviewBatch: 'v1.9.4',
  },
  'ch19-linear-function': {
    checkedTitle: '一次函数',
    checkedSections: ['19.1 函数', '19.2 一次函数', '19.3 课题学习 选择方案'],
    reviewBatch: 'v1.9.4',
    scopeNote: '仅复核稳定容器，不替代新版逐册目录映射',
  },
  'ch20-data-analysis': {
    checkedTitle: '数据的分析',
    checkedSections: ['20.1 数据的集中趋势', '20.2 数据的波动程度', '20.3 课题学习 体质健康测试中的数据分析'],
    reviewBatch: 'v1.9.4',
    scopeNote: '仅复核稳定容器，不替代新版逐册目录映射',
  },
  'ch21-quadratic-equation': {
    checkedTitle: '一元二次方程',
    checkedSections: ['21.1 一元二次方程', '21.2 解一元二次方程', '21.3 实际问题与一元二次方程'],
    reviewBatch: 'v1.9.4',
  },
  'ch22-quadratic-function': {
    checkedTitle: '二次函数',
    checkedSections: ['22.1 二次函数的图象和性质', '22.2 二次函数与一元二次方程', '22.3 实际问题与二次函数'],
    reviewBatch: 'v1.9.4',
  },
  'ch23-rotation': {
    checkedTitle: '旋转',
    checkedSections: ['23.1 图形的旋转', '23.2 中心对称', '23.3 课题学习 图案设计'],
    reviewBatch: 'v1.9.4',
  },
  'ch24-circle': {
    checkedTitle: '圆',
    checkedSections: ['24.1 圆的有关性质', '24.2 点和圆、直线和圆的位置关系', '24.3 正多边形和圆', '24.4 弧长和扇形面积'],
    reviewBatch: 'v1.9.4',
  },
  'ch25-probability': {
    checkedTitle: '概率初步',
    checkedSections: ['25.1 随机事件与概率', '25.2 用列举法求概率', '25.3 用频率估计概率'],
    reviewBatch: 'v1.9.4',
  },
  'ch26-inverse-function': {
    checkedTitle: '反比例函数',
    checkedSections: ['26.1 反比例函数', '26.2 实际问题与反比例函数'],
    reviewBatch: 'v1.9.4',
  },
  'ch27-similarity': {
    checkedTitle: '相似',
    checkedSections: ['27.1 图形的相似', '27.2 相似三角形', '27.3 位似'],
    reviewBatch: 'v1.9.4',
  },
  'ch28-trigonometry': {
    checkedTitle: '锐角三角函数',
    checkedSections: ['28.1 锐角三角函数', '28.2 解直角三角形'],
    reviewBatch: 'v1.9.4',
  },
  'ch29-projection': {
    checkedTitle: '投影与视图',
    checkedSections: ['29.1 投影', '29.2 三视图', '29.3 课题学习 制作立体模型'],
    reviewBatch: 'v1.9.4',
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
    reviewBatch: record.reviewBatch || 'v1.9.3',
    ...(record.scopeNote ? { scopeNote: record.scopeNote } : {}),
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
