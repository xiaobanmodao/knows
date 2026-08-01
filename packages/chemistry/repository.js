const { resolveAssetUrl } = require('../../utils/asset-config');
const { themes } = require('./data/chemistry-themes');
const { topics } = require('./data/chemistry-topics');
const { knowledgeItems } = require('./data/chemistry-knowledge');
const { templates } = require('./data/chemistry-templates');

const SUBJECT = Object.freeze({
  id: 'chemistry',
  name: '化学',
  shortName: '化学',
  status: 'building',
  gradeBands: ['九年级'],
  summary: '从实验事实、物质性质、微粒模型和化学用语建立初中化学知识体系。',
});

const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
const knowledgeMap = new Map(knowledgeItems.map((knowledge) => [knowledge.id, knowledge]));
const templateMap = new Map(templates.map((template) => [template.id, template]));
const orderedKnowledge = topics.flatMap((topic) => (
  topic.knowledgeIds.map((knowledgeId) => knowledgeMap.get(knowledgeId)).filter(Boolean)
));
const navigationIndex = new Map(orderedKnowledge.map((knowledge, index) => [knowledge.id, index]));

function clone(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function hydrateKnowledge(knowledge) {
  if (!knowledge) return null;
  return clone({
    ...knowledge,
    containerId: knowledge.topicId,
    coverImage: resolveAssetUrl(knowledge.coverImage),
    templates: (knowledge.templateIds || []).map((templateId) => templateMap.get(templateId)).filter(Boolean).map(hydrateTemplate),
  });
}

function hydrateTemplate(template) {
  if (!template) return null;
  return clone({
    ...template,
    containerId: template.topicIds[0],
    figure: resolveAssetUrl(template.figure),
  });
}

function hydrateTopic(topic) {
  if (!topic) return null;
  const knowledge = topic.knowledgeIds.map((knowledgeId) => knowledgeMap.get(knowledgeId)).filter(Boolean);
  const methods = topic.templateIds.map((templateId) => templateMap.get(templateId)).filter(Boolean);

  return clone({
    ...topic,
    coverImage: resolveAssetUrl(topic.coverImage),
    diagramImages: (topic.diagramImages || []).map((diagram) => ({
      ...diagram,
      image: resolveAssetUrl(diagram.image),
    })),
    knowledgeItems: knowledge.map(hydrateKnowledge),
    templates: methods.map(hydrateTemplate),
    knowledgeCount: knowledge.length,
    templateCount: methods.length,
  });
}

function buildSubjectHome() {
  const resolvedTopics = topics.map(hydrateTopic);
  const resolvedThemes = themes.map((theme) => {
    const themeTopics = theme.topicIds.map((topicId) => hydrateTopic(topicMap.get(topicId))).filter(Boolean);
    const templateIds = new Set(themeTopics.flatMap((topic) => topic.templateIds));

    return {
      ...theme,
      topics: themeTopics,
      topicCount: themeTopics.length,
      knowledgeCount: themeTopics.reduce((sum, topic) => sum + topic.knowledgeCount, 0),
      templateCount: templateIds.size,
    };
  });

  return {
    subject: {
      ...SUBJECT,
      counts: {
        themes: themes.length,
        topics: topics.length,
        knowledge: knowledgeItems.length,
        templates: templates.length,
      },
    },
    themes: resolvedThemes,
    topics: resolvedTopics,
    themeCount: themes.length,
    topicCount: topics.length,
    knowledgeCount: knowledgeItems.length,
    templateCount: templates.length,
  };
}

const subjectHome = buildSubjectHome();

function getSubjectHome() {
  return clone(subjectHome);
}

function getTopicById(topicId) {
  return hydrateTopic(topicMap.get(topicId));
}

function getKnowledgeById(knowledgeId) {
  return hydrateKnowledge(knowledgeMap.get(knowledgeId));
}

function getTemplateById(templateId) {
  return hydrateTemplate(templateMap.get(templateId));
}

function getKnowledgeContext(knowledge) {
  if (!knowledge) return null;
  const topic = topicMap.get(knowledge.topicId);
  return topic ? clone({ id: topic.id, type: 'topic', title: topic.title }) : null;
}

function toNavigationEntry(knowledge) {
  return knowledge ? { id: knowledge.id, title: knowledge.title, topicId: knowledge.topicId } : null;
}

function getKnowledgeNavigation(knowledgeId) {
  const index = navigationIndex.has(knowledgeId) ? navigationIndex.get(knowledgeId) : -1;

  return {
    index,
    count: orderedKnowledge.length,
    previous: index >= 0 ? toNavigationEntry(orderedKnowledge[index - 1]) : null,
    next: index >= 0 ? toNavigationEntry(orderedKnowledge[index + 1]) : null,
  };
}

function getRelatedKnowledge(knowledge, limit = 3) {
  if (!knowledge) return [];
  const count = Math.max(0, Number.isFinite(Number(limit)) ? Math.floor(Number(limit)) : 3);
  if (!count) return [];

  const candidates = [];
  const seen = new Set([knowledge.id]);
  const append = (candidate) => {
    if (!candidate || seen.has(candidate.id) || candidates.length >= count) return;
    seen.add(candidate.id);
    candidates.push(candidate);
  };

  (knowledge.relatedIds || []).forEach((knowledgeId) => append(knowledgeMap.get(knowledgeId)));
  const topic = topicMap.get(knowledge.topicId);
  (topic ? topic.knowledgeIds : []).forEach((knowledgeId) => append(knowledgeMap.get(knowledgeId)));

  return candidates.map(hydrateKnowledge);
}

module.exports = {
  getSubjectHome,
  getTopicById,
  getKnowledgeById,
  getTemplateById,
  getKnowledgeContext,
  getKnowledgeNavigation,
  getRelatedKnowledge,
};
