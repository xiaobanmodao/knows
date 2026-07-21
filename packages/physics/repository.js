const content = require('./data/physics-content');
const curriculum = require('./data/physics-curriculum');
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
    containerId: template.containerId || (template.chapterIds || [])[0] || (template.topicIds || [])[0] || '',
    figure: resolveAssetUrl(template.figure),
  };
}

function hydrateChapter(chapter) {
  return {
    ...chapter,
    coverImage: resolveAssetUrl(chapter.coverImage),
    diagramImage: resolveAssetUrl(chapter.diagramImage),
    knowledgeItems: (chapter.knowledgeItems || []).map(hydrateKnowledge),
    template: hydrateTemplate(chapter.template),
    templates: (chapter.templates || []).map(hydrateTemplate),
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
    subject: getSubjectMeta('physics'),
    topics: content.topics.map(hydrateTopic),
    gradePackages: [],
    unitBooks: [],
    physicsBooks: curriculum.books,
  };
}

function getPhysicsChapterById(chapterId) {
  const chapter = curriculum.getChapterById(chapterId);
  return chapter ? hydrateChapter(chapter) : null;
}

function getPhysicsChapterNavigation(chapterId) {
  const chapter = curriculum.getChapterById(chapterId);
  const book = chapter ? curriculum.books.find((item) => item.id === chapter.bookId) : null;
  return chapter && book ? getNeighborNavigation(book.chapters, chapterId) : getNeighborNavigation([], chapterId);
}

function getTopicById(subjectId, topicId) {
  const topic = content.topics.find((item) => item.id === topicId);
  return topic ? {
    ...hydrateTopic(topic),
    chapters: curriculum.chapters
      .filter((chapter) => chapter.topicId === topicId)
      .map((chapter) => ({
        id: chapter.id,
        label: `${chapter.chapterLabel} ${chapter.title}`,
        summary: chapter.summary,
        knowledgeCount: chapter.knowledgeCount,
      })),
  } : null;
}

function getKnowledgeById(subjectId, knowledgeId) {
  const knowledge = curriculum.getKnowledgeById(knowledgeId)
    || content.knowledgeItems.find((item) => item.id === knowledgeId);
  return knowledge ? hydrateKnowledge(knowledge) : null;
}

function getTemplateById(subjectId, templateId) {
  const template = curriculum.getTemplateById(templateId)
    || content.templates.find((item) => item.id === templateId);
  return template ? hydrateTemplate(template) : null;
}

function getKnowledgeContext(subjectId, knowledge) {
  if (!knowledge) return null;
  const chapter = knowledge.chapterId && curriculum.getChapterById(knowledge.chapterId);
  if (chapter) {
    return { id: chapter.id, title: chapter.title, subtitle: `${chapter.bookLabel} · ${chapter.chapterLabel}`, type: 'chapter' };
  }
  const topic = getTopicById('physics', knowledge.topicId);
  return topic ? { id: topic.id, title: topic.title, subtitle: '物理专题', type: 'topic' } : null;
}

function getRelatedKnowledge(subjectId, knowledge, limit = 3) {
  if (!knowledge) return [];
  const chapter = knowledge.chapterId && curriculum.getChapterById(knowledge.chapterId);
  const items = chapter
    ? chapter.knowledgeItems
    : ((content.topics.find((item) => item.id === knowledge.topicId) || {}).knowledgeItems || []);
  return items.filter((item) => item.id !== knowledge.id).slice(0, limit).map(hydrateKnowledge);
}

function getKnowledgeNavigation(subjectId, knowledgeId) {
  const knowledge = curriculum.getKnowledgeById(knowledgeId)
    || content.knowledgeItems.find((item) => item.id === knowledgeId);
  if (!knowledge) return getNeighborNavigation([], knowledgeId);
  const chapter = knowledge.chapterId && curriculum.getChapterById(knowledge.chapterId);
  const topic = content.topics.find((item) => item.id === knowledge.topicId);
  return getNeighborNavigation(chapter ? chapter.knowledgeItems : (topic ? topic.knowledgeItems : []), knowledgeId);
}

module.exports = {
  SUBJECT_LABELS,
  normalizeSubjectId: () => 'physics',
  getSubjectHome,
  getPhysicsChapterById,
  getPhysicsChapterNavigation,
  getTopicById,
  getKnowledgeById,
  getTemplateById,
  getKnowledgeContext,
  getRelatedKnowledge,
  getKnowledgeNavigation,
};
