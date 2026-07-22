const crypto = require('crypto');
const math = require('../packages/math/repository');
const englishContent = require('../packages/english/data/english-content');
const englishUnits = require('../packages/english/data/english-units');
const physicsContent = require('../packages/physics/data/physics-content');
const physicsCurriculum = require('../packages/physics/data/physics-curriculum');

function flatten(values) {
  return values.flatMap((value) => (Array.isArray(value) ? flatten(value) : [value]));
}

function compactText(value, maxLength = 140) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function uniqueTokens(...values) {
  const seen = new Set();
  return flatten(values)
    .map((value) => compactText(value, 80))
    .filter((value) => value && value.length <= 80)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 24);
}

function makeEntry({
  refId,
  subjectId,
  type,
  containerId = '',
  focusId = '',
  title,
  subtitle,
  description,
  tags = [],
  tokens = [],
}) {
  const identity = focusId || refId;
  return {
    key: `${subjectId}:${type}:${identity}`,
    refId,
    subjectId,
    type,
    containerId,
    focusId,
    title: compactText(title),
    subtitle: compactText(subtitle),
    description: compactText(description),
    tags: uniqueTokens(tags).slice(0, 4),
    tokens: uniqueTokens(title, tags, tokens),
  };
}

function buildMathEntries() {
  const chapters = math.getAllChapters();
  const topics = math.getMathStudyMap().topicGroups.flatMap((group) => group.topics);
  const templates = math.getAllTemplates();
  const chapterEntries = chapters.map((chapter) => makeEntry({
    refId: chapter.id,
    subjectId: 'math',
    type: 'chapter',
    containerId: chapter.id,
    title: chapter.title,
    subtitle: `${chapter.stage} · ${chapter.chapterNo}`,
    description: chapter.highlight || chapter.chapterLead,
    tags: chapter.tags,
    tokens: [chapter.chapterNo, chapter.subtitle, chapter.officialSections, chapter.outlineItems],
  }));
  const knowledgeEntries = chapters.flatMap((chapter) => chapter.knowledgeItems.map((knowledge) => makeEntry({
    refId: knowledge.id,
    subjectId: 'math',
    type: 'knowledge',
    containerId: chapter.id,
    title: knowledge.title,
    subtitle: `数学 · ${chapter.stage} · ${chapter.title}`,
    description: knowledge.summary,
    tags: knowledge.tags,
    tokens: [knowledge.keywords, knowledge.knowledgePoints, knowledge.legacyIds],
  })));
  const topicEntries = topics.map((topic) => makeEntry({
    refId: topic.id,
    subjectId: 'math',
    type: 'topic',
    containerId: topic.id,
    title: topic.title,
    subtitle: `数学 · ${topic.stage || topic.grade}`,
    description: topic.summary,
    tags: topic.focus,
    tokens: [topic.signals, topic.checkpoints && topic.checkpoints.map((item) => item.title)],
  }));
  const templateEntries = templates.map((template) => makeEntry({
    refId: template.id,
    subjectId: 'math',
    type: 'template',
    containerId: (template.relatedChapters || [])[0] || '',
    title: template.name,
    subtitle: `数学 · ${template.category}`,
    description: template.summary,
    tags: template.keywords,
    tokens: [template.cues, template.steps],
  }));

  return [...chapterEntries, ...topicEntries, ...knowledgeEntries, ...templateEntries];
}

function buildEnglishEntries() {
  const unitEntries = englishUnits.units.map((unit) => makeEntry({
    refId: unit.id,
    subjectId: 'english',
    type: 'unit',
    containerId: unit.bookId,
    title: `${unit.unitLabel} ${unit.title}`,
    subtitle: `英语 · ${unit.bookLabel}`,
    description: unit.theme,
    tags: [unit.theme, `${unit.vocabularyCount} 词`, `${unit.grammarCount} 语法`],
    tokens: [unit.title, unit.unitLabel, unit.expressions],
  }));
  const wordEntries = englishUnits.vocabulary.map((word) => makeEntry({
    refId: word.unitId,
    focusId: word.id,
    subjectId: 'english',
    type: 'word',
    containerId: word.unitId,
    title: word.word,
    subtitle: `英语 · ${word.bookLabel} · ${word.unitTitle}`,
    description: `${word.partOfSpeech} · ${word.meaning}。${word.usage}`,
    tags: word.collocations,
    tokens: [
      word.meaning,
      word.partOfSpeech,
      word.forms,
      word.collocations,
      word.note,
      word.searchTerms,
      word.spellingVariants && word.spellingVariants.map((item) => item.value),
      word.senses && word.senses.flatMap((item) => [item.meaning, item.countability, item.transitivity]),
      word.collocationDetails && word.collocationDetails.flatMap((item) => [item.phrase, item.meaning]),
      word.distinctions && word.distinctions.map((item) => item.target),
    ],
  }));
  const grammarEntries = englishUnits.grammarPoints.map((point) => makeEntry({
    refId: point.unitId,
    focusId: point.id,
    subjectId: 'english',
    type: 'grammar',
    containerId: point.unitId,
    title: point.title,
    subtitle: `英语 · ${point.bookLabel} · ${point.unitTitle}`,
    description: point.summary,
    tags: point.structures,
    tokens: [
      point.structures,
      point.mistakes,
      point.conditions,
      point.variants && point.variants.flatMap((item) => [item.label, item.structure]),
      point.contrasts && point.contrasts.map((item) => item.target),
    ],
  }));
  const topicEntries = englishContent.topics.map((topic) => makeEntry({
    refId: topic.id,
    subjectId: 'english',
    type: 'topic',
    containerId: topic.id,
    title: topic.title,
    subtitle: `英语 · ${topic.gradeText || '专题知识'}`,
    description: topic.summary,
    tags: topic.keywords,
    tokens: [topic.signals, topic.checkpoints && topic.checkpoints.map((item) => item.title)],
  }));
  const knowledgeEntries = englishContent.knowledgeItems.map((knowledge) => {
    const topic = englishContent.topics.find((item) => item.id === knowledge.topicId);
    return makeEntry({
      refId: knowledge.id,
      subjectId: 'english',
      type: 'knowledge',
      containerId: knowledge.topicId,
      title: knowledge.title,
      subtitle: `英语 · ${topic ? topic.title : '专题知识'}`,
      description: knowledge.summary,
      tags: knowledge.tags,
      tokens: [knowledge.keywords, knowledge.knowledgePoints],
    });
  });
  const templateEntries = englishContent.templates.map((template) => makeEntry({
    refId: template.id,
    subjectId: 'english',
    type: 'template',
    containerId: (template.topicIds || [])[0] || '',
    title: template.name,
    subtitle: `英语 · ${template.category}`,
    description: template.summary,
    tags: template.keywords,
    tokens: [template.cues, template.steps],
  }));

  return [...unitEntries, ...wordEntries, ...grammarEntries, ...topicEntries, ...knowledgeEntries, ...templateEntries];
}

function buildPhysicsEntries() {
  const chapterEntries = physicsCurriculum.chapters.map((chapter) => makeEntry({
    refId: chapter.id,
    subjectId: 'physics',
    type: 'chapter',
    containerId: chapter.bookId,
    title: `${chapter.chapterLabel} ${chapter.title}`,
    subtitle: `物理 · ${chapter.bookLabel}`,
    description: chapter.summary,
    tags: chapter.keywords,
    tokens: [chapter.signals, chapter.formulas],
  }));
  const knowledgeEntries = physicsCurriculum.knowledgeItems.map((knowledge) => {
    const chapter = physicsCurriculum.getChapterById(knowledge.chapterId);
    return makeEntry({
      refId: knowledge.id,
      subjectId: 'physics',
      type: 'knowledge',
      containerId: knowledge.chapterId,
      title: knowledge.title,
      subtitle: `物理 · ${chapter ? `${chapter.chapterLabel} ${chapter.title}` : '教材章节'}`,
      description: knowledge.summary,
      tags: knowledge.tags,
      tokens: [knowledge.keywords, knowledge.knowledgePoints, knowledge.sections && knowledge.sections.map((section) => section.formula)],
    });
  });
  const templateEntries = physicsCurriculum.templates.map((template) => {
    const chapter = physicsCurriculum.getChapterById((template.chapterIds || [])[0]);
    return makeEntry({
      refId: template.id,
      subjectId: 'physics',
      type: 'template',
      containerId: (template.chapterIds || [])[0] || '',
      title: template.name,
      subtitle: `物理 · ${chapter ? chapter.title : template.category}`,
      description: template.summary,
      tags: template.keywords,
      tokens: [template.cues, template.steps],
    });
  });
  const topicEntries = physicsContent.topics.map((topic) => makeEntry({
    refId: topic.id,
    subjectId: 'physics',
    type: 'topic',
    containerId: topic.id,
    title: topic.title,
    subtitle: `物理 · ${topic.gradeText || '专题知识'}`,
    description: topic.summary,
    tags: topic.keywords,
    tokens: [topic.signals, topic.checkpoints && topic.checkpoints.map((item) => item.title)],
  }));
  const structuredKnowledgeEntries = physicsContent.knowledgeItems.map((knowledge) => {
    const topic = physicsContent.topics.find((item) => item.id === knowledge.topicId);
    return makeEntry({
      refId: knowledge.id,
      subjectId: 'physics',
      type: 'knowledge',
      containerId: knowledge.topicId,
      title: knowledge.title,
      subtitle: `物理 · ${topic ? topic.title : '专题知识'}`,
      description: knowledge.summary,
      tags: knowledge.tags,
      tokens: [knowledge.keywords, knowledge.knowledgePoints, knowledge.sections && knowledge.sections.map((section) => section.formula)],
    });
  });
  const structuredTemplateEntries = physicsContent.templates.map((template) => makeEntry({
    refId: template.id,
    subjectId: 'physics',
    type: 'template',
    containerId: (template.topicIds || [])[0] || '',
    title: template.name,
    subtitle: `物理 · ${template.category}`,
    description: template.summary,
    tags: template.keywords,
    tokens: [template.cues, template.steps],
  }));

  return [
    ...chapterEntries,
    ...knowledgeEntries,
    ...templateEntries,
    ...topicEntries,
    ...structuredKnowledgeEntries,
    ...structuredTemplateEntries,
  ];
}

function buildSearchIndex() {
  const entries = [...buildMathEntries(), ...buildEnglishEntries(), ...buildPhysicsEntries()];
  const keySet = new Set();
  entries.forEach((entry) => {
    if (keySet.has(entry.key)) {
      throw new Error(`Duplicate search key: ${entry.key}`);
    }
    keySet.add(entry.key);
  });

  const sourceHash = crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  const subjectCounts = entries.reduce((counts, entry) => ({
    ...counts,
    [entry.subjectId]: (counts[entry.subjectId] || 0) + 1,
  }), {});

  return {
    meta: {
      version: 1,
      sourceHash,
      entryCount: entries.length,
      subjectCounts,
    },
    entries,
  };
}

function renderSearchIndexModule(index) {
  const subjectCodes = ['math', 'english', 'physics'];
  const typeCodes = ['unit', 'word', 'grammar', 'chapter', 'topic', 'knowledge', 'template'];
  const subjectMap = Object.fromEntries(subjectCodes.map((value, position) => [value, position]));
  const typeMap = Object.fromEntries(typeCodes.map((value, position) => [value, position]));
  const rows = index.entries.map((entry) => [
    entry.refId,
    subjectMap[entry.subjectId],
    typeMap[entry.type],
    entry.containerId,
    entry.focusId,
    entry.title,
    entry.subtitle,
    entry.description,
    entry.tags,
    entry.tokens,
  ]);
  return `// Generated by scripts/build-search-index.js. Do not edit manually.\nconst SEARCH_INDEX_META=${JSON.stringify(index.meta)};\nconst SUBJECT_CODES=${JSON.stringify(subjectCodes)};\nconst TYPE_CODES=${JSON.stringify(typeCodes)};\nconst SEARCH_INDEX_ROWS=${JSON.stringify(rows)};\nmodule.exports={SEARCH_INDEX_META,SUBJECT_CODES,TYPE_CODES,SEARCH_INDEX_ROWS};\n`;
}

module.exports = {
  buildSearchIndex,
  renderSearchIndexModule,
};
