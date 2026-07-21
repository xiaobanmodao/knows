const content = require('./data/english-content');
const units = require('./data/english-units');
const { getSubjectMeta, SUBJECT_LABELS } = require('../../data/subject-manifest');
const { resolveAssetUrl } = require('../../utils/asset-config');

function hydrateTopic(topic) {
  return {
    ...topic,
    coverImage: resolveAssetUrl(topic.coverImage),
    diagramImage: resolveAssetUrl(topic.diagramImage),
  };
}

function hydrateKnowledge(knowledge) {
  return {
    ...knowledge,
    coverImage: resolveAssetUrl(knowledge.coverImage),
    problems: (knowledge.problems || []).map((problem) => ({
      ...problem,
      image: resolveAssetUrl(problem.image),
    })),
  };
}

function hydrateTemplate(template) {
  return {
    ...template,
    containerId: template.containerId || (template.topicIds || [])[0] || '',
    figure: resolveAssetUrl(template.figure),
  };
}

function getNeighborNavigation(items, currentId) {
  const index = items.findIndex((item) => item.id === currentId);
  const toEntry = (item) => item ? { id: item.id, title: item.title } : null;
  return index < 0 ? { index: -1, count: items.length, previous: null, next: null } : {
    index,
    count: items.length,
    previous: toEntry(items[index - 1]),
    next: toEntry(items[index + 1]),
  };
}

function getSubjectHome() {
  return {
    subject: getSubjectMeta('english'),
    topics: content.topics.map(hydrateTopic),
    gradePackages: [],
    unitBooks: units.books,
    physicsBooks: [],
  };
}

function getEnglishUnitById(unitId) {
  const unit = units.getUnitById(unitId);
  return unit ? { ...unit, coverImage: resolveAssetUrl(unit.coverImage) } : null;
}

function getEnglishUnitNavigation(unitId) {
  const unit = units.getUnitById(unitId);
  const book = unit ? units.books.find((item) => item.id === unit.bookId) : null;
  return unit && book ? getNeighborNavigation(book.units, unitId) : getNeighborNavigation([], unitId);
}

function getTopicById(subjectId, topicId) {
  const topic = content.topics.find((item) => item.id === topicId);
  return topic ? hydrateTopic(topic) : null;
}

function getKnowledgeById(subjectId, knowledgeId) {
  const knowledge = content.knowledgeItems.find((item) => item.id === knowledgeId);
  return knowledge ? hydrateKnowledge(knowledge) : null;
}

function getTemplateById(subjectId, templateId) {
  const template = content.templates.find((item) => item.id === templateId);
  return template ? hydrateTemplate(template) : null;
}

function getKnowledgeContext(subjectId, knowledge) {
  const topic = knowledge && getTopicById('english', knowledge.topicId);
  return topic ? { id: topic.id, title: topic.title, subtitle: '英语专题', type: 'topic' } : null;
}

function getRelatedKnowledge(subjectId, knowledge, limit = 3) {
  const topic = knowledge && content.topics.find((item) => item.id === knowledge.topicId);
  return topic ? topic.knowledgeItems
    .filter((item) => item.id !== knowledge.id)
    .slice(0, limit)
    .map(hydrateKnowledge) : [];
}

function getKnowledgeNavigation(subjectId, knowledgeId) {
  const knowledge = content.knowledgeItems.find((item) => item.id === knowledgeId);
  const topic = knowledge && content.topics.find((item) => item.id === knowledge.topicId);
  return getNeighborNavigation(topic ? topic.knowledgeItems : [], knowledgeId);
}

module.exports = {
  SUBJECT_LABELS,
  normalizeSubjectId: () => 'english',
  getSubjectHome,
  getEnglishUnitById,
  getEnglishUnitNavigation,
  getTopicById,
  getKnowledgeById,
  getTemplateById,
  getKnowledgeContext,
  getRelatedKnowledge,
  getKnowledgeNavigation,
  getPhysicsChapterById: () => null,
};
