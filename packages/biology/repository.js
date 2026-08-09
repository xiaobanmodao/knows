const { resolveAssetUrl } = require('../../utils/asset-config');
const { topics } = require('./data/biology-topics');
const { knowledgeItems } = require('./data/biology-knowledge');
const { templates } = require('./data/biology-templates');

const SUBJECT = Object.freeze({
  id: 'biology',
  name: '初中生物',
  shortName: '生物',
  gradeBands: ['七年级'],
  summary: '按六个单元梳理生物与细胞、生态系统和生命延续发展的基础知识。',
});

const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
const knowledgeMap = new Map(knowledgeItems.map((knowledge) => [knowledge.id, knowledge]));
const templateMap = new Map(templates.map((template) => [template.id, template]));

function clone(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function hydrateTemplate(template) {
  if (!template) return null;
  return clone({
    ...template,
    containerId: template.topicIds[0] || '',
    figure: resolveAssetUrl(template.figure),
  });
}

function hydrateKnowledge(knowledge) {
  if (!knowledge) return null;
  return clone({
    ...knowledge,
    containerId: knowledge.topicId,
    coverImage: resolveAssetUrl(knowledge.coverImage),
    templates: (knowledge.templateIds || []).map((templateId) => hydrateTemplate(templateMap.get(templateId))).filter(Boolean),
  });
}

function hydrateTopic(topic) {
  if (!topic) return null;
  const unitKnowledge = topic.knowledgeIds.map((knowledgeId) => knowledgeMap.get(knowledgeId)).filter(Boolean);
  const unitTemplates = topic.templateIds.map((templateId) => templateMap.get(templateId)).filter(Boolean);
  return clone({
    ...topic,
    coverImage: resolveAssetUrl(topic.coverImage),
    knowledgeItems: unitKnowledge.map(hydrateKnowledge),
    templates: unitTemplates.map(hydrateTemplate),
    knowledgeCount: unitKnowledge.length,
    templateCount: unitTemplates.length,
  });
}

function normalizeId(first, second) {
  return second === undefined ? first : second;
}

function getSubjectHome() {
  return clone({
    subject: { ...SUBJECT, counts: { units: topics.length, knowledge: knowledgeItems.length, templates: templates.length } },
    topics: topics.map(hydrateTopic),
    unitCount: topics.length,
    knowledgeCount: knowledgeItems.length,
    templateCount: templates.length,
  });
}

function getTopicById(subjectId, topicId) {
  return hydrateTopic(topicMap.get(normalizeId(subjectId, topicId)));
}

function getKnowledgeById(subjectId, knowledgeId) {
  return hydrateKnowledge(knowledgeMap.get(normalizeId(subjectId, knowledgeId)));
}

function getTemplateById(subjectId, templateId) {
  return hydrateTemplate(templateMap.get(normalizeId(subjectId, templateId)));
}

function getKnowledgeContext(subjectId, knowledge) {
  const resolvedKnowledge = knowledge === undefined ? subjectId : knowledge;
  if (!resolvedKnowledge) return null;
  const topic = topicMap.get(resolvedKnowledge.topicId);
  return topic ? clone({ id: topic.id, type: 'unit', title: topic.title, subtitle: topic.unitLabel }) : null;
}

function getRelatedKnowledge(subjectId, knowledge, limit = 3) {
  const resolvedKnowledge = knowledge === undefined || typeof knowledge === 'number' ? subjectId : knowledge;
  const resolvedLimit = typeof knowledge === 'number' ? knowledge : limit;
  if (!resolvedKnowledge) return [];
  const topic = topicMap.get(resolvedKnowledge.topicId);
  const count = Math.max(0, Number.isFinite(Number(resolvedLimit)) ? Math.floor(Number(resolvedLimit)) : 3);
  return (topic ? topic.knowledgeIds : [])
    .filter((knowledgeId) => knowledgeId !== resolvedKnowledge.id)
    .slice(0, count)
    .map((knowledgeId) => hydrateKnowledge(knowledgeMap.get(knowledgeId)));
}

function getKnowledgeNavigation(subjectId, knowledgeId) {
  const id = normalizeId(subjectId, knowledgeId);
  const knowledge = knowledgeMap.get(id);
  const topic = knowledge && topicMap.get(knowledge.topicId);
  const items = topic ? topic.knowledgeIds.map((itemId) => knowledgeMap.get(itemId)).filter(Boolean) : [];
  const index = items.findIndex((item) => item.id === id);
  const toEntry = (item) => (item ? { id: item.id, title: item.title, topicId: item.topicId } : null);
  return {
    index,
    count: items.length,
    previous: index >= 0 ? toEntry(items[index - 1]) : null,
    next: index >= 0 ? toEntry(items[index + 1]) : null,
  };
}

module.exports = {
  normalizeSubjectId: () => 'biology',
  getSubjectHome,
  getTopicById,
  getKnowledgeById,
  getTemplateById,
  getKnowledgeContext,
  getRelatedKnowledge,
  getKnowledgeNavigation,
};
