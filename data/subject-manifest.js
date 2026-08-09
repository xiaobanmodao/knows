const SUBJECT_LABELS = {
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
};

const SUBJECT_MANIFEST = [
  {
    id: 'math',
    name: '初中数学',
    shortName: '数学',
    subtitle: '七至九年级知识地图',
    description: '按年级、专题和章节梳理知识点与方法模板。',
    gradeBands: ['七年级', '八年级', '九年级'],
    theme: 'math',
    status: 'active',
    packageRoot: 'packages/math',
    entryRoute: '/packages/math/pages/index/index',
    packagePages: [
      'pages/index/index',
      'pages/chapter/index',
      'pages/topic/index',
      'pages/knowledge/index',
      'pages/template/index',
    ],
    routes: {
      subject: '/packages/math/pages/index/index',
      chapter: '/packages/math/pages/chapter/index',
      topic: '/packages/math/pages/topic/index',
      knowledge: '/packages/math/pages/knowledge/index',
      template: '/packages/math/pages/template/index',
    },
    contentTypes: ['subject', 'chapter', 'topic', 'knowledge', 'template'],
    referenceKinds: ['formula'],
    counts: {
      chapter: 29,
      topic: 29,
      knowledge: 89,
      template: 36,
    },
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
    packagePages: [
      'pages/index/index',
      'pages/unit/index',
      'pages/topic/index',
      'pages/knowledge/index',
      'pages/template/index',
    ],
    routes: {
      subject: '/packages/english/pages/index/index',
      unit: '/packages/english/pages/unit/index',
      word: '/packages/english/pages/unit/index',
      grammar: '/packages/english/pages/unit/index',
      topic: '/packages/english/pages/topic/index',
      knowledge: '/packages/english/pages/knowledge/index',
      template: '/packages/english/pages/template/index',
    },
    contentTypes: ['subject', 'unit', 'word', 'grammar', 'topic', 'knowledge', 'template'],
    referenceKinds: ['word', 'grammar'],
    counts: {
      book: 5,
      unit: 42,
      topic: 6,
      knowledge: 18,
      vocabulary: 336,
      grammar: 84,
      template: 6,
      example: 924,
    },
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
    packagePages: [
      'pages/index/index',
      'pages/chapter/index',
      'pages/topic/index',
      'pages/knowledge/index',
      'pages/template/index',
    ],
    routes: {
      subject: '/packages/physics/pages/index/index',
      chapter: '/packages/physics/pages/chapter/index',
      topic: '/packages/physics/pages/topic/index',
      knowledge: '/packages/physics/pages/knowledge/index',
      template: '/packages/physics/pages/template/index',
    },
    contentTypes: ['subject', 'chapter', 'topic', 'knowledge', 'template'],
    referenceKinds: ['formula', 'experiment'],
    counts: {
      book: 3,
      chapter: 22,
      topic: 6,
      knowledge: 84,
      template: 22,
      example: 252,
      experiment: 29,
    },
    packageLabel: '22 章',
  },
  {
    id: 'chemistry',
    name: '初中化学',
    shortName: '化学',
    subtitle: '九年级化学知识专题',
    description: '按课标主题和知识专题梳理概念、实验、方程式与方法。',
    gradeBands: ['九年级'],
    theme: 'chemistry',
    status: 'active',
    packageRoot: 'packages/chemistry',
    entryRoute: '/packages/chemistry/pages/index/index',
    packagePages: [
      'pages/index/index',
      'pages/topic/index',
      'pages/knowledge/index',
      'pages/template/index',
    ],
    routes: {
      subject: '/packages/chemistry/pages/index/index',
      topic: '/packages/chemistry/pages/topic/index',
      knowledge: '/packages/chemistry/pages/knowledge/index',
      template: '/packages/chemistry/pages/template/index',
    },
    contentTypes: ['subject', 'topic', 'knowledge', 'template'],
    referenceKinds: ['experiment', 'equation'],
    counts: {
      theme: 5,
      topic: 10,
      knowledge: 40,
      template: 12,
      experiment: 8,
      equation: 28,
    },
    packageLabel: '10 专题',
  },
  {
    id: 'biology',
    name: '初中生物',
    shortName: '生物',
    subtitle: '七至八年级生物六单元知识地图',
    description: '按单元梳理生命科学基础知识、观察证据与科学方法。',
    gradeBands: ['七年级', '八年级'],
    theme: 'biology',
    status: 'active',
    packageRoot: 'packages/biology',
    entryRoute: '/packages/biology/pages/index/index',
    packagePages: [
      'pages/index/index',
      'pages/topic/index',
      'pages/knowledge/index',
      'pages/template/index',
    ],
    routes: {
      subject: '/packages/biology/pages/index/index',
      topic: '/packages/biology/pages/topic/index',
      knowledge: '/packages/biology/pages/knowledge/index',
      template: '/packages/biology/pages/template/index',
    },
    contentTypes: ['subject', 'topic', 'knowledge', 'template'],
    referenceKinds: ['experiment'],
    counts: {
      unit: 6,
      topic: 6,
      knowledge: 36,
      template: 6,
      example: 108,
    },
    packageLabel: '6 单元',
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

const COUNT_ALIASES = {
  book: 'bookCount',
  chapter: 'chapterCount',
  unit: 'unitCount',
  topic: 'topicCount',
  knowledge: 'knowledgeCount',
  template: 'templateCount',
  vocabulary: 'vocabularyCount',
  grammar: 'grammarCount',
  example: 'exampleCount',
  experiment: 'experimentCount',
};

function hydrateSubject(subject) {
  const counts = { ...(subject.counts || {}) };
  const aliases = Object.entries(COUNT_ALIASES).reduce((result, [key, alias]) => ({
    ...result,
    [alias]: counts[key] || 0,
  }), {});
  return {
    ...subject,
    gradeBands: [...(subject.gradeBands || [])],
    packagePages: [...(subject.packagePages || [])],
    routes: { ...(subject.routes || {}) },
    contentTypes: [...(subject.contentTypes || [])],
    referenceKinds: [...(subject.referenceKinds || [])],
    counts,
    ...aliases,
  };
}

function getSubjectRegistry({ includeBuilding = false } = {}) {
  return SUBJECT_MANIFEST
    .filter((subject) => includeBuilding || subject.status === 'active')
    .map(hydrateSubject);
}

function getSubjectMeta(subjectId, options) {
  const subjects = getSubjectRegistry(options);
  return subjects.find((subject) => subject.id === subjectId)
    || subjects.find((subject) => subject.id === 'math')
    || subjects[0];
}

function getSubjectIds(options) {
  return getSubjectRegistry(options).map((subject) => subject.id);
}

function getSubjectRoutes(subjectId, options) {
  return { ...getSubjectMeta(subjectId, options).routes };
}

module.exports = {
  SUBJECT_LABELS,
  SUBJECT_MANIFEST,
  FEATURED_MATH_CHAPTERS,
  COUNT_ALIASES,
  getSubjectRegistry,
  getSubjectMeta,
  getSubjectIds,
  getSubjectRoutes,
};
