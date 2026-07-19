const fs = require('fs');
const math = require('../utils/math');
const english = require('../data/english-content');
const englishUnits = require('../data/english-units');
const physics = require('../data/physics-content');
const physicsCurriculum = require('../data/physics-curriculum');
const subjects = require('../utils/subjects');

const issues = [];
const globalIds = new Map();

function registerId(id, owner) {
  if (!id) {
    issues.push(`${owner}: 缺少稳定 ID`);
  } else if (globalIds.has(id)) {
    issues.push(`${owner}: ID 与 ${globalIds.get(id)} 重复 -> ${id}`);
  } else {
    globalIds.set(id, owner);
  }
}

function localPath(assetPath) {
  return String(assetPath || '').replace(/^\//, '');
}

function rejectRemovedFields(item, fields, owner) {
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(item, field)) {
      issues.push(`${owner}: 不应保留任务型字段 ${field}`);
    }
  });
}

function checkStructuredSubject(content, expectedId) {
  const { subject, topics, knowledgeItems, templates } = content;

  if (subject.id !== expectedId || topics.length !== 6 || knowledgeItems.length < 18 || templates.length < 6) {
    issues.push(`${expectedId}: 应达到 6 专题、18 知识点、6 模板`);
  }

  if (subject.exampleCount < 54) {
    issues.push(`${expectedId}: 原创示例应不少于 54 道`);
  }

  topics.forEach((topic) => {
    registerId(topic.id, `${subject.name}/${topic.title}`);
    rejectRemovedFields(topic, ['objective', 'practiceFlow', 'finishCriteria'], `${subject.name}/${topic.title}`);
    const requiredText = ['title', 'summary', 'coverImage', 'diagramImage'];
    requiredText.forEach((field) => {
      if (!topic[field]) issues.push(`${topic.title}: 缺少 ${field}`);
    });
    ['signals', 'checkpoints'].forEach((field) => {
      if (!Array.isArray(topic[field]) || topic[field].length < 4) {
        issues.push(`${topic.title}: ${field} 至少 4 项`);
      }
    });
    if (topic.knowledgeItems.length < 3 || topic.templates.length < 1 || topic.exampleCount < 9) {
      issues.push(`${topic.title}: 至少需要 3 知识点、1 模板、9 示例`);
    }
    topic.knowledgeIds.forEach((id) => {
      if (!knowledgeItems.some((item) => item.id === id)) issues.push(`${topic.title}: 知识点引用不存在 -> ${id}`);
    });
    topic.templateIds.forEach((id) => {
      if (!templates.some((item) => item.id === id)) issues.push(`${topic.title}: 模板引用不存在 -> ${id}`);
    });
  });

  knowledgeItems.forEach((knowledge) => {
    registerId(knowledge.id, `${subject.name}/${knowledge.title}`);
    rejectRemovedFields(knowledge, ['learningPath'], `${subject.name}/${knowledge.title}`);
    if (knowledge.subjectId !== expectedId || !topics.some((topic) => topic.id === knowledge.topicId)) {
      issues.push(`${knowledge.title}: subjectId 或 topicId 无效`);
    }
    if (!Array.isArray(knowledge.problems) || knowledge.problems.length < 3) {
      issues.push(`${knowledge.title}: 至少需要 3 道原创示例`);
    }
    knowledge.problems.forEach((problem) => registerId(problem.id, `${knowledge.title}/${problem.title}`));
  });

  templates.forEach((template) => {
    registerId(template.id, `${subject.name}/${template.name}`);
    if (!template.figure || !template.examples || !template.examples.length) {
      issues.push(`${template.name}: 缺少独立图示或样题`);
    }
  });
}

math.getAllChapters().forEach((chapter) => {
  registerId(chapter.id, `数学章节/${chapter.title}`);
  rejectRemovedFields(chapter, ['studyGuide', 'learningPath'], `数学章节/${chapter.title}`);
  chapter.knowledgeItems.forEach((knowledge) => {
    registerId(knowledge.id, `数学知识点/${knowledge.title}`);
    rejectRemovedFields(knowledge, ['learningPath'], `数学知识点/${knowledge.title}`);
  });
});
math.getMathStudyMap().topicGroups.flatMap((group) => group.topics)
  .forEach((topic) => {
    registerId(topic.id, `数学专题/${topic.title}`);
    rejectRemovedFields(topic, ['objective', 'practiceFlow', 'finishCriteria'], `数学专题/${topic.title}`);
  });
math.getAllTemplates().forEach((template) => registerId(template.id, `数学模板/${template.name}`));

checkStructuredSubject(english, 'english');
checkStructuredSubject(physics, 'physics');

physicsCurriculum.books.forEach((book) => registerId(book.id, `物理教材/${book.label}`));
physicsCurriculum.chapters.forEach((chapter) => {
  registerId(chapter.id, `物理章节/${chapter.title}`);
  rejectRemovedFields(chapter, ['objective'], `物理章节/${chapter.title}`);
  chapter.knowledgeItems.forEach((knowledge) => {
    registerId(knowledge.id, `物理知识点/${chapter.title}/${knowledge.title}`);
    rejectRemovedFields(knowledge, ['learningPath'], `物理知识点/${chapter.title}/${knowledge.title}`);
    knowledge.problems.forEach((problem) => registerId(problem.id, `物理示例/${knowledge.title}/${problem.title}`));
  });
  chapter.templates.forEach((template) => registerId(template.id, `物理模板/${template.name}`));
});

englishUnits.books.forEach((book) => registerId(book.id, `英语教材/${book.label}`));
englishUnits.units.forEach((unit) => {
  registerId(unit.id, `英语单元/${unit.bookLabel}/${unit.title}`);
  rejectRemovedFields(unit, ['bigQuestion', 'objective', 'outputTask', 'selfCheck'], `英语单元/${unit.bookLabel}/${unit.title}`);
  unit.vocabulary.forEach((word) => registerId(word.id, `英语单词/${unit.title}/${word.word}`));
  unit.grammarPoints.forEach((point) => registerId(point.id, `英语语法/${unit.title}/${point.title}`));
});

[
  ['被动语态', 'english'],
  ['定语从句', 'english'],
  ['阅读主旨', 'english'],
  ['受力分析', 'physics'],
  ['浮力', 'physics'],
  ['欧姆定律', 'physics'],
].forEach(([keyword, subjectId]) => {
  const results = subjects.searchAllSubjects(keyword);
  if (!results.some((result) => result.subjectId === subjectId)) {
    issues.push(`搜索“${keyword}”未命中 ${subjectId}`);
  }
});

const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
['pages/subject/index', 'pages/topic/index', 'pages/english-unit/index', 'pages/physics-chapter/index'].forEach((page) => {
  if (!appJson.pages.includes(page)) issues.push(`app.json 缺少页面 ${page}`);
});

if (issues.length) {
  console.log('FOUND_SUBJECT_CONTENT_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK 3 subjects, ${globalIds.size} globally unique content IDs checked`);
