const SUBJECT_LABELS = {
  math: '数学',
  english: '英语',
  physics: '物理',
};

const SUBJECT_MANIFEST = [
  {
    id: 'math',
    name: '初中数学',
    shortName: '数学',
    subtitle: '七至九年级知识地图',
    description: '按年级、专题和章节梳理知识点与题型方法。',
    gradeBands: ['七年级', '八年级', '九年级'],
    theme: 'math',
    status: 'active',
    packageRoot: 'packages/math',
    entryRoute: '/packages/math/pages/index/index',
    chapterCount: 29,
    topicCount: 29,
    knowledgeCount: 89,
    templateCount: 36,
    packageLabel: '29 专题',
  },
  {
    id: 'english',
    name: '初中英语',
    shortName: '英语',
    subtitle: '人教版七至九年级教材单元',
    description: '按人教版教材单元学习核心词汇、语法、例句与综合表达。',
    gradeBands: ['七年级', '八年级', '九年级'],
    theme: 'english',
    status: 'active',
    packageRoot: 'packages/english',
    entryRoute: '/packages/english/pages/index/index',
    bookCount: 5,
    unitCount: 42,
    topicCount: 6,
    knowledgeCount: 18,
    vocabularyCount: 336,
    grammarCount: 84,
    templateCount: 6,
    exampleCount: 504,
    packageLabel: '42 单元',
  },
  {
    id: 'physics',
    name: '初中物理',
    shortName: '物理',
    subtitle: '人教版八至九年级教材章节',
    description: '按人教版 22 章学习物理现象、实验、公式与解题方法。',
    gradeBands: ['八年级', '九年级'],
    theme: 'physics',
    status: 'active',
    packageRoot: 'packages/physics',
    entryRoute: '/packages/physics/pages/index/index',
    bookCount: 3,
    chapterCount: 22,
    topicCount: 6,
    knowledgeCount: 84,
    templateCount: 22,
    exampleCount: 252,
    experimentCount: 29,
    packageLabel: '22 章',
  },
];

const FEATURED_MATH_CHAPTERS = [
  { id: 'ch01-rational', stage: '七年级上册', title: '有理数', subtitle: '正负数、数轴与有理数运算', highlight: '从算术过渡到代数的第一块基石。', tags: ['数与代数', '基础'] },
  { id: 'ch02-expression', stage: '七年级上册', title: '整式的加减', subtitle: '整式、同类项与代数化简', highlight: '初中代数表达与化简能力的起点。', tags: ['代数式', '化简'] },
  { id: 'ch03-linear-equation', stage: '七年级上册', title: '一元一次方程', subtitle: '从算式到方程，再到实际问题', highlight: '建立方程思想，学会用未知数描述现实问题。', tags: ['方程', '应用题'] },
  { id: 'ch04-basic-geometry', stage: '七年级上册', title: '几何图形初步', subtitle: '几何图形、线段、角与简单设计', highlight: '从图形直观走向几何语言。', tags: ['几何', '图形'] },
  { id: 'ch05-parallel', stage: '七年级下册', title: '相交线与平行线', subtitle: '角位关系、判定、性质与平移', highlight: '初中几何证明的起步章节。', tags: ['几何', '证明'] },
  { id: 'ch06-real', stage: '七年级下册', title: '实数', subtitle: '平方根、立方根与实数系统', highlight: '从有理数扩展到更完整的数系。', tags: ['实数', '数系扩展'] },
  { id: 'ch07-coordinate', stage: '七年级下册', title: '平面直角坐标系', subtitle: '坐标表示与坐标方法应用', highlight: '数形结合正式进入主线。', tags: ['坐标', '数形结合'] },
  { id: 'ch08-system', stage: '七年级下册', title: '二元一次方程组', subtitle: '消元思想与多元方程组', highlight: '两未知量建模与解题的核心入口。', tags: ['方程组', '建模'] },
];

function getSubjectRegistry() {
  return SUBJECT_MANIFEST.map((subject) => ({ ...subject }));
}

function getSubjectMeta(subjectId) {
  return SUBJECT_MANIFEST.find((subject) => subject.id === subjectId) || SUBJECT_MANIFEST[0];
}

module.exports = {
  SUBJECT_LABELS,
  SUBJECT_MANIFEST,
  FEATURED_MATH_CHAPTERS,
  getSubjectRegistry,
  getSubjectMeta,
};
