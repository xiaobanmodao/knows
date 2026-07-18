const { chapterCatalog } = require('../data/math-curriculum');

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

  const legacyMatch = /^(.*)-lesson-(\d+)$/.exec(knowledgeId);

  if (!legacyMatch) {
    return knowledgeId;
  }

  const chapter = chapterCatalog.find((item) => item.id === legacyMatch[1]);
  const sectionIndex = Number(legacyMatch[2]) - 1;
  const sectionTitle = chapter && chapter.officialSections[sectionIndex];

  return sectionTitle ? getStableLessonId(chapter.id, sectionTitle) : knowledgeId;
}

module.exports = {
  getStableLessonId,
  resolveKnowledgeId,
};
