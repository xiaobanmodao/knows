const math = require('../packages/math/repository');
const english = require('../packages/english/data/english-content');
const englishUnits = require('../packages/english/data/english-units');
const physics = require('../packages/physics/data/physics-content');
const physicsCurriculum = require('../packages/physics/data/physics-curriculum');
const { SUBJECT_MANIFEST } = require('../data/subject-manifest');

const issues = [];
const globalIds = new Set();
let formulaCount = 0;
let experimentCount = 0;

function requireFields(entity, fields, label) {
  fields.forEach((field) => {
    const value = entity[field];
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) {
      issues.push(`${label} 缺少字段 ${field}`);
    }
  });
}

function register(entity, type, subjectId) {
  requireFields(entity, ['id'], `${subjectId}/${type}`);
  const key = `${subjectId}:${type}:${entity.id}`;
  if (globalIds.has(key)) issues.push(`内容 ID 重复: ${key}`);
  globalIds.add(key);
}

function checkSections(knowledge, label) {
  (knowledge.sections || []).forEach((section, index) => {
    if (section.type === 'formula') {
      formulaCount += 1;
      requireFields(section, ['title', 'formula', 'description'], `${label} 公式 ${index + 1}`);
    }

    if (section.type === 'experiment') {
      experimentCount += 1;
      requireFields(
        section,
        ['title', 'goal', 'apparatus', 'steps', 'phenomenon', 'conclusion', 'errors', 'safety'],
        `${label} 实验 ${index + 1}`,
      );
    }
  });
}

SUBJECT_MANIFEST.forEach((subject) => {
  register(subject, 'subject', subject.id);
  requireFields(subject, ['name', 'shortName', 'description', 'gradeBands', 'packageRoot', 'entryRoute'], `学科 ${subject.id}`);
});

const mathChapters = math.getAllChapters();
const mathTopics = math.getMathStudyMap().topicGroups.flatMap((group) => group.topics);
const mathChapterIds = new Set(mathChapters.map((item) => item.id));
mathChapters.forEach((chapter) => {
  register(chapter, 'chapter', 'math');
  requireFields(chapter, ['title', 'stage', 'knowledgeItems', 'templateItems'], `数学章节 ${chapter.id}`);
  chapter.knowledgeItems.forEach((knowledge) => {
    register(knowledge, 'knowledge', 'math');
    requireFields(knowledge, ['chapterId', 'title', 'summary', 'contentMeta', 'sections', 'problems'], `数学知识点 ${knowledge.id}`);
    checkSections(knowledge, `数学知识点 ${knowledge.id}`);
    if (!mathChapterIds.has(knowledge.chapterId)) issues.push(`数学知识点父级无效: ${knowledge.id}`);
  });
});
mathTopics.forEach((topic) => {
  register(topic, 'topic', 'math');
  requireFields(topic, ['gradeId', 'title', 'chapterIds', 'summary', 'signals', 'checkpoints', 'image'], `数学专题 ${topic.id}`);
  topic.chapterIds.forEach((id) => {
    if (!mathChapterIds.has(id)) issues.push(`数学专题章节引用无效: ${topic.id} -> ${id}`);
  });
});
math.getAllTemplates().forEach((template) => {
  register(template, 'template', 'math');
  requireFields(template, ['name', 'category', 'steps', 'cues', 'figure'], `数学模板 ${template.id}`);
});

const englishUnitIds = new Set(englishUnits.units.map((item) => item.id));
englishUnits.units.forEach((unit) => {
  register(unit, 'unit', 'english');
  requireFields(unit, ['bookId', 'title', 'theme', 'contentMeta', 'vocabulary', 'grammarPoints'], `英语单元 ${unit.id}`);
});
englishUnits.vocabulary.forEach((word) => {
  register(word, 'word', 'english');
  requireFields(word, ['unitId', 'word', 'partOfSpeech', 'meaning', 'usage', 'example', 'translation', 'contentMeta'], `英语单词 ${word.id}`);
  if (!englishUnitIds.has(word.unitId)) issues.push(`英语单词父级无效: ${word.id}`);
});
englishUnits.grammarPoints.forEach((grammar) => {
  register(grammar, 'grammar', 'english');
  requireFields(grammar, ['unitId', 'title', 'summary', 'structures', 'examples', 'contentMeta'], `英语语法 ${grammar.id}`);
  if (!englishUnitIds.has(grammar.unitId)) issues.push(`英语语法父级无效: ${grammar.id}`);
});

const physicsChapterIds = new Set(physicsCurriculum.chapters.map((item) => item.id));
physicsCurriculum.chapters.forEach((chapter) => {
  register(chapter, 'chapter', 'physics');
  requireFields(chapter, ['bookId', 'title', 'summary', 'contentMeta', 'knowledgeItems', 'templates'], `物理章节 ${chapter.id}`);
});
physicsCurriculum.knowledgeItems.forEach((knowledge) => {
  register(knowledge, 'knowledge', 'physics');
  requireFields(knowledge, ['chapterId', 'title', 'summary', 'contentMeta', 'sections', 'problems'], `物理知识点 ${knowledge.id}`);
  checkSections(knowledge, `物理知识点 ${knowledge.id}`);
  if (!physicsChapterIds.has(knowledge.chapterId)) issues.push(`物理知识点父级无效: ${knowledge.id}`);
});

[[english, 'english'], [physics, 'physics']].forEach(([content, subjectId]) => {
  const topicIds = new Set(content.topics.map((item) => item.id));
  content.topics.forEach((topic) => {
    register(topic, 'topic', subjectId);
    requireFields(topic, ['title', 'gradeBands', 'summary', 'signals', 'checkpoints', 'coverImage', 'diagramImage', 'knowledgeItems', 'templates'], `${subjectId} 专题 ${topic.id}`);
  });
  content.knowledgeItems.forEach((knowledge) => {
    register(knowledge, 'structured-knowledge', subjectId);
    requireFields(knowledge, ['topicId', 'title', 'summary', 'contentMeta', 'sections', 'problems'], `${subjectId} 专题知识 ${knowledge.id}`);
    checkSections(knowledge, `${subjectId} 专题知识 ${knowledge.id}`);
    if (!topicIds.has(knowledge.topicId)) issues.push(`${subjectId} 专题知识父级无效: ${knowledge.id}`);
  });
  content.templates.forEach((template) => {
    register(template, 'structured-template', subjectId);
    requireFields(template, ['name', 'category', 'steps', 'cues', 'figure'], `${subjectId} 专题模板 ${template.id}`);
  });
});

physicsCurriculum.templates.forEach((template) => {
  register(template, 'template', 'physics');
  requireFields(template, ['name', 'category', 'steps', 'cues', 'figure'], `物理模板 ${template.id}`);
});

if (issues.length) {
  console.log('FOUND_CONTENT_SCHEMA_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK ${globalIds.size} schema entities, ${formulaCount} formulas, ${experimentCount} experiments and parent references checked`);
