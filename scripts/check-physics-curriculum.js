const fs = require('fs');
const physics = require('../packages/physics/data/physics-curriculum');
const subjects = require('../utils/subjects');

const issues = [];
const ids = new Map();
const expectedChapterTitles = [
  '机械运动', '声现象', '物态变化', '光现象', '透镜及其应用', '质量与密度',
  '力', '运动和力', '压强', '浮力', '功和机械能', '简单机械',
  '内能', '内能的利用', '电流和电路', '电压 电阻', '欧姆定律', '电功率',
  '生活用电', '电与磁', '信息的传递', '能源与可持续发展',
];

function registerId(id, owner) {
  if (!id) {
    issues.push(`${owner}: 缺少稳定 ID`);
  } else if (ids.has(id)) {
    issues.push(`${owner}: ID 与 ${ids.get(id)} 重复 -> ${id}`);
  } else {
    ids.set(id, owner);
  }
}

function requireText(value, owner, field) {
  if (!String(value || '').trim()) issues.push(`${owner}: 缺少 ${field}`);
}

if (physics.bookCount !== 3
  || physics.chapterCount !== 22
  || physics.knowledgeCount !== 84
  || physics.templateCount !== 22
  || physics.exampleCount !== 252) {
  issues.push(`规模错误：当前 ${physics.bookCount} 册、${physics.chapterCount} 章、${physics.knowledgeCount} 知识点、${physics.templateCount} 模板、${physics.exampleCount} 示例，应为 3/22/84/22/252`);
}

physics.books.forEach((book) => {
  registerId(book.id, `物理教材/${book.label}`);
  ['label', 'shortLabel', 'sourceNote'].forEach((field) => requireText(book[field], book.label, field));
});

physics.chapters.forEach((chapter, index) => {
  const owner = `${chapter.chapterLabel} ${chapter.title}`;
  registerId(chapter.id, owner);
  if (chapter.number !== index + 1 || chapter.title !== expectedChapterTitles[index]) {
    issues.push(`${owner}: 章节序号或目录标题与基线不符`);
  }
  ['summary', 'topicId', 'bookId', 'coverImage', 'diagramImage'].forEach((field) => requireText(chapter[field], owner, field));
  if (!Array.isArray(chapter.keywords) || chapter.keywords.length < 4) issues.push(`${owner}: 关键词至少 4 项`);
  if (!Array.isArray(chapter.signals) || chapter.signals.length < 4) issues.push(`${owner}: 题干信号至少 4 项`);
  if (!Array.isArray(chapter.formulas) || chapter.formulas.length < 1) issues.push(`${owner}: 公式与规律至少 1 项`);
  if (!Array.isArray(chapter.knowledgeItems) || chapter.knowledgeItems.length < 3) issues.push(`${owner}: 知识点至少 3 项`);
  if (!chapter.template || chapter.templates.length !== 1) issues.push(`${owner}: 应有 1 个独立章节方法模板`);

  chapter.knowledgeItems.forEach((knowledge) => {
    const knowledgeOwner = `${owner}/${knowledge.title}`;
    registerId(knowledge.id, knowledgeOwner);
    ['title', 'summary', 'chapterId', 'topicId', 'coverImage', 'figureCaption'].forEach((field) => requireText(knowledge[field], knowledgeOwner, field));
    if (knowledge.chapterId !== chapter.id || knowledge.subjectId !== 'physics') issues.push(`${knowledgeOwner}: 章节或学科引用无效`);
    if (!Array.isArray(knowledge.knowledgePoints) || knowledge.knowledgePoints.length < 3) issues.push(`${knowledgeOwner}: 核心知识至少 3 项`);
    if (!Array.isArray(knowledge.mistakeChecklist) || knowledge.mistakeChecklist.length < 2) issues.push(`${knowledgeOwner}: 易错检查至少 2 项`);
    if (!Array.isArray(knowledge.sections) || knowledge.sections.length < 4) issues.push(`${knowledgeOwner}: 讲解模块至少 4 个`);
    if (!Array.isArray(knowledge.problems) || knowledge.problems.length !== 3) issues.push(`${knowledgeOwner}: 应有 3 道原创示例`);
    knowledge.problems.forEach((problem) => {
      registerId(problem.id, `${knowledgeOwner}/${problem.title}`);
      ['stem', 'answer', 'analysis'].forEach((field) => requireText(problem[field], knowledgeOwner, field));
      if (!Array.isArray(problem.steps) || problem.steps.length < 3) issues.push(`${knowledgeOwner}: 示例解题过程至少 3 步`);
    });
  });

  chapter.templates.forEach((template) => {
    const templateOwner = `${owner}/${template.name}`;
    registerId(template.id, templateOwner);
    ['name', 'summary', 'category', 'figure'].forEach((field) => requireText(template[field], templateOwner, field));
    if (!template.chapterIds.includes(chapter.id)) issues.push(`${templateOwner}: 未引用所属章节`);
    if (!Array.isArray(template.steps) || template.steps.length < 4) issues.push(`${templateOwner}: 方法步骤至少 4 项`);
    if (!Array.isArray(template.pitfalls) || template.pitfalls.length < 2) issues.push(`${templateOwner}: 易错点至少 2 项`);
  });
});

[
  ['牛顿第一定律', 'knowledge'],
  ['托里拆利', 'knowledge'],
  ['阿基米德原理', 'knowledge'],
  ['伏安法', 'knowledge'],
  ['焦耳定律', 'knowledge'],
  ['电磁感应', 'knowledge'],
  ['光纤', 'knowledge'],
].forEach(([keyword, type]) => {
  const results = subjects.searchAllSubjects(keyword, 'physics');
  if (!results.some((item) => item.subjectId === 'physics' && item.type === type)) {
    issues.push(`物理搜索“${keyword}”未命中 ${type}`);
  }
});

const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
if (!appJson.pages.includes('pages/physics-chapter/index')) {
  issues.push('app.json 缺少物理章节页');
}

if (issues.length) {
  console.log('FOUND_PHYSICS_CURRICULUM_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

const experimentCount = physics.knowledgeItems.filter((knowledge) => (
  knowledge.sections.some((section) => section.type === 'experiment')
)).length;
console.log(`OK ${physics.bookCount} books, ${physics.chapterCount} chapters, ${physics.knowledgeCount} knowledge points, ${physics.templateCount} templates, ${physics.exampleCount} examples, ${experimentCount} experiments, ${ids.size} unique IDs checked`);
