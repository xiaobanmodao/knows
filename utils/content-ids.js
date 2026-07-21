const { LEGACY_KNOWLEDGE_ALIASES } = require('../data/content-id-aliases');

function getStableLessonId(chapterId, sectionTitle) {
  const normalizedTitle = String(sectionTitle || '')
    .replace(/^\d+(?:\.\d+)*\s*/, '')
    .replace(/[\s—–（）()·，、：:]/g, '');
  let hash = 2166136261;

  for (let index = 0; index < normalizedTitle.length; index += 1) {
    hash ^= normalizedTitle.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `${chapterId}-lesson-s${(hash >>> 0).toString(36)}`;
}

function resolveKnowledgeId(knowledgeId) {
  if (!knowledgeId) {
    return knowledgeId;
  }

  return LEGACY_KNOWLEDGE_ALIASES[knowledgeId] || knowledgeId;
}

module.exports = {
  getStableLessonId,
  resolveKnowledgeId,
};
