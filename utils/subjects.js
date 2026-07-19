const math = require('./math');
const englishContent = require('../data/english-content');
const englishUnits = require('../data/english-units');
const physicsContent = require('../data/physics-content');
const physicsCurriculum = require('../data/physics-curriculum');
const { resolveAssetUrl } = require('./asset-config');

const SUBJECT_LABELS = {
  math: '数学',
  english: '英语',
  physics: '物理',
};

const contentBySubject = {
  english: englishContent,
  physics: physicsContent,
};

function normalizeSubjectId(subjectId) {
  return contentBySubject[subjectId] ? subjectId : 'math';
}

function hydrateSubjectTopic(topic) {
  return {
    ...topic,
    coverImage: resolveAssetUrl(topic.coverImage),
    diagramImage: resolveAssetUrl(topic.diagramImage),
  };
}

function hydrateSubjectKnowledge(knowledge) {
  return {
    ...knowledge,
    coverImage: resolveAssetUrl(knowledge.coverImage),
    problems: (knowledge.problems || []).map((problem) => ({
      ...problem,
      image: resolveAssetUrl(problem.image),
    })),
  };
}

function hydrateSubjectTemplate(template) {
  return {
    ...template,
    containerId: template.containerId || (template.topicIds || [])[0] || '',
    figure: resolveAssetUrl(template.figure),
  };
}

function hydrateEnglishUnit(unit) {
  return {
    ...unit,
    coverImage: resolveAssetUrl(unit.coverImage),
  };
}

function hydratePhysicsChapter(chapter) {
  return {
    ...chapter,
    coverImage: resolveAssetUrl(chapter.coverImage),
    diagramImage: resolveAssetUrl(chapter.diagramImage),
    knowledgeItems: (chapter.knowledgeItems || []).map(hydrateSubjectKnowledge),
    template: hydrateSubjectTemplate(chapter.template),
    templates: (chapter.templates || []).map(hydrateSubjectTemplate),
  };
}

function getSubjectRegistry() {
  const mathMap = math.getMathStudyMap();
  const mathKnowledgeCount = math.getAllChapters()
    .reduce((total, chapter) => total + chapter.knowledgeItems.length, 0);

  return [
    {
      id: 'math',
      name: '初中数学',
      shortName: '数学',
      subtitle: '七至九年级知识地图',
      description: '按年级、专题和章节梳理知识点与题型方法。',
      gradeBands: ['七年级', '八年级', '九年级'],
      theme: 'math',
      status: 'active',
      chapterCount: math.getAllChapters().length,
      topicCount: mathMap.topicCount,
      knowledgeCount: mathKnowledgeCount,
      templateCount: math.getAllTemplates().length,
      packageLabel: `${mathMap.topicCount} 专题`,
    },
    {
      ...englishContent.subject,
      bookCount: englishUnits.bookCount,
      unitCount: englishUnits.unitCount,
      vocabularyCount: englishUnits.vocabularyCount,
      grammarCount: englishUnits.grammarCount,
      packageLabel: `${englishUnits.unitCount} 单元`,
      subtitle: '人教版七至九年级教材单元',
      description: '按人教版教材单元学习核心词汇、语法、例句与综合表达。',
    },
    {
      ...physicsContent.subject,
      subtitle: '人教版八至九年级教材章节',
      description: '按人教版 22 章学习物理现象、实验、公式与解题方法。',
      bookCount: physicsCurriculum.bookCount,
      chapterCount: physicsCurriculum.chapterCount,
      knowledgeCount: physicsCurriculum.knowledgeCount,
      templateCount: physicsCurriculum.templateCount,
      exampleCount: physicsCurriculum.exampleCount,
      packageLabel: `${physicsCurriculum.chapterCount} 章`,
    },
  ];
}

function getSubjectMeta(subjectId) {
  const id = normalizeSubjectId(subjectId);
  return getSubjectRegistry().find((subject) => subject.id === id) || null;
}

function getSubjectHome(subjectId) {
  const id = normalizeSubjectId(subjectId);

  if (id === 'math') {
    const studyMap = math.getMathStudyMap();
    return {
      subject: getSubjectMeta('math'),
      topics: studyMap.topicGroups.flatMap((group) => group.topics),
      gradePackages: studyMap.gradePackages,
    };
  }

  const content = contentBySubject[id];
  return {
    subject: getSubjectMeta(id),
    topics: content.topics.map(hydrateSubjectTopic),
    gradePackages: [],
    unitBooks: id === 'english' ? englishUnits.books : [],
    physicsBooks: id === 'physics' ? physicsCurriculum.books : [],
  };
}

function getEnglishUnitById(unitId) {
  const unit = englishUnits.getUnitById(unitId);
  return unit ? hydrateEnglishUnit(unit) : null;
}

function getPhysicsChapterById(chapterId) {
  const chapter = physicsCurriculum.getChapterById(chapterId);
  return chapter ? hydratePhysicsChapter(chapter) : null;
}

function getTopicById(subjectId, topicId) {
  const id = normalizeSubjectId(subjectId);

  if (id === 'math') {
    const topic = math.getMathStudyMap().topicGroups
      .flatMap((group) => group.topics)
      .find((item) => item.id === topicId);
    return topic ? { ...topic, subjectId: 'math' } : null;
  }

  const topic = contentBySubject[id].topics.find((item) => item.id === topicId);

  if (!topic) {
    return null;
  }

  const hydratedTopic = hydrateSubjectTopic(topic);

  if (id !== 'physics') {
    return hydratedTopic;
  }

  return {
    ...hydratedTopic,
    chapters: physicsCurriculum.chapters
      .filter((chapter) => chapter.topicId === topicId)
      .map((chapter) => ({
        id: chapter.id,
        label: `${chapter.chapterLabel} ${chapter.title}`,
        summary: chapter.summary,
        knowledgeCount: chapter.knowledgeCount,
      })),
  };
}

function getKnowledgeById(subjectId, knowledgeId) {
  const id = normalizeSubjectId(subjectId);

  if (id === 'math') {
    const knowledge = math.getKnowledgeById(knowledgeId);
    return knowledge ? {
      ...knowledge,
      subjectId: 'math',
      topicId: '',
      containerId: knowledge.chapterId,
    } : null;
  }

  const canonicalPhysicsKnowledge = id === 'physics'
    ? physicsCurriculum.getKnowledgeById(knowledgeId)
    : null;
  const knowledge = canonicalPhysicsKnowledge
    || contentBySubject[id].knowledgeItems.find((item) => item.id === knowledgeId);
  return knowledge ? hydrateSubjectKnowledge(knowledge) : null;
}

function getTemplateById(subjectId, templateId) {
  const id = normalizeSubjectId(subjectId);

  if (id === 'math') {
    const template = math.getTemplateById(templateId);
    return template ? {
      ...template,
      subjectId: 'math',
      topicIds: [],
      containerId: (template.relatedChapters || [])[0] || '',
    } : null;
  }

  const canonicalPhysicsTemplate = id === 'physics'
    ? physicsCurriculum.getTemplateById(templateId)
    : null;
  const template = canonicalPhysicsTemplate
    || contentBySubject[id].templates.find((item) => item.id === templateId);
  return template ? hydrateSubjectTemplate(template) : null;
}

function getKnowledgeContext(subjectId, knowledge) {
  const id = normalizeSubjectId(subjectId);

  if (!knowledge) {
    return null;
  }

  if (id === 'math') {
    const chapter = math.getChapterById(knowledge.chapterId);
    return chapter ? {
      id: chapter.id,
      title: chapter.title,
      subtitle: `${chapter.stage} · ${chapter.chapterNo}`,
      type: 'chapter',
    } : null;
  }

  if (id === 'physics' && knowledge.chapterId) {
    const chapter = physicsCurriculum.getChapterById(knowledge.chapterId);
    return chapter ? {
      id: chapter.id,
      title: chapter.title,
      subtitle: `${chapter.bookLabel} · ${chapter.chapterLabel}`,
      type: 'chapter',
    } : null;
  }

  const topic = getTopicById(id, knowledge.topicId);
  return topic ? {
    id: topic.id,
    title: topic.title,
    subtitle: `${SUBJECT_LABELS[id]}专题`,
    type: 'topic',
  } : null;
}

function getRelatedKnowledge(subjectId, knowledge, limit = 3) {
  const id = normalizeSubjectId(subjectId);

  if (!knowledge) {
    return [];
  }

  if (id === 'math') {
    const chapter = math.getChapterById(knowledge.chapterId);
    return chapter ? chapter.knowledgeItems
      .filter((item) => item.id !== knowledge.id)
      .slice(0, limit) : [];
  }

  if (id === 'physics' && knowledge.chapterId) {
    const chapter = physicsCurriculum.getChapterById(knowledge.chapterId);
    return chapter ? chapter.knowledgeItems
      .filter((item) => item.id !== knowledge.id)
      .slice(0, limit)
      .map(hydrateSubjectKnowledge) : [];
  }

  const topic = getTopicById(id, knowledge.topicId);
  return topic ? topic.knowledgeItems
    .filter((item) => item.id !== knowledge.id)
    .slice(0, limit)
    .map(hydrateSubjectKnowledge) : [];
}

function includesKeyword(value, keyword) {
  return String(value || '').toLowerCase().includes(keyword);
}

function scoreContent(keyword, title, fields) {
  const normalizedTitle = String(title || '').toLowerCase();
  let score = normalizedTitle === keyword ? 120 : normalizedTitle.includes(keyword) ? 80 : 0;

  if (fields.some((field) => includesKeyword(field, keyword))) {
    score += 30;
  }

  return score;
}

function searchStructuredSubject(subjectId, keyword) {
  const content = contentBySubject[subjectId];
  const subjectLabel = SUBJECT_LABELS[subjectId];
  const topicResults = content.topics.map((topic) => ({
    score: scoreContent(keyword, topic.title, [topic.summary, ...(topic.keywords || []), ...(topic.signals || [])]),
    id: `topic-${subjectId}-${topic.id}`,
    refId: topic.id,
    subjectId,
    subjectLabel,
    type: 'topic',
    typeLabel: '专题',
    containerId: topic.id,
    title: topic.title,
    subtitle: `${subjectLabel} · ${topic.knowledgeCount} 个知识点`,
    description: topic.summary,
    tags: topic.keywords.slice(0, 4),
  }));
  const knowledgeResults = content.knowledgeItems.map((knowledge) => {
    const topic = content.topics.find((item) => item.id === knowledge.topicId);
    return {
      score: scoreContent(keyword, knowledge.title, [knowledge.summary, ...(knowledge.tags || []), ...(knowledge.keywords || [])]),
      id: `knowledge-${subjectId}-${knowledge.id}`,
      refId: knowledge.id,
      subjectId,
      subjectLabel,
      type: 'knowledge',
      typeLabel: '知识点',
      containerId: knowledge.topicId,
      title: knowledge.title,
      subtitle: `${subjectLabel} · ${topic ? topic.title : '专题知识'}`,
      description: knowledge.summary,
      tags: knowledge.tags.slice(0, 4),
    };
  });
  const templateResults = content.templates.map((template) => ({
    score: scoreContent(keyword, template.name, [template.category, template.summary, ...(template.keywords || []), ...(template.cues || [])]),
    id: `template-${subjectId}-${template.id}`,
    refId: template.id,
    subjectId,
    subjectLabel,
    type: 'template',
    typeLabel: '方法模板',
    containerId: (template.topicIds || [])[0] || '',
    title: template.name,
    subtitle: `${subjectLabel} · ${template.category}`,
    description: template.summary,
    tags: template.keywords.slice(0, 4),
  }));

  return [...topicResults, ...knowledgeResults, ...templateResults].filter((item) => item.score > 0);
}

function searchEnglishUnits(keyword) {
  const unitResults = englishUnits.units.map((unit) => ({
    score: scoreContent(keyword, unit.title, [unit.unitLabel, unit.bookLabel, unit.theme, ...(unit.expressions || [])]),
    id: `unit-english-${unit.id}`,
    refId: unit.id,
    subjectId: 'english',
    subjectLabel: SUBJECT_LABELS.english,
    type: 'unit',
    typeLabel: '教材单元',
    containerId: unit.bookId,
    title: `${unit.unitLabel} ${unit.title}`,
    subtitle: `英语 · ${unit.bookLabel}`,
    description: unit.theme,
    tags: [unit.theme, `${unit.vocabularyCount} 词`, `${unit.grammarCount} 语法`],
  }));
  const wordResults = englishUnits.vocabulary.map((word) => ({
    score: scoreContent(keyword, word.word, [word.meaning, word.partOfSpeech, word.usage, word.forms, ...(word.collocations || []), word.example, word.translation, word.note]),
    id: `word-english-${word.id}`,
    refId: word.unitId,
    subjectId: 'english',
    subjectLabel: SUBJECT_LABELS.english,
    type: 'word',
    typeLabel: '单词',
    containerId: word.unitId,
    title: word.word,
    subtitle: `英语 · ${word.bookLabel} · ${word.unitTitle}`,
    description: `${word.partOfSpeech} · ${word.meaning}。${word.usage}`,
    tags: (word.collocations || []).slice(0, 3),
  }));
  const grammarResults = englishUnits.grammarPoints.map((point) => ({
    score: scoreContent(keyword, point.title, [point.summary, ...(point.structures || []), ...(point.mistakes || []), ...point.examples.flatMap((item) => [item.sentence, item.translation, item.explanation])]),
    id: `grammar-english-${point.id}`,
    refId: point.unitId,
    subjectId: 'english',
    subjectLabel: SUBJECT_LABELS.english,
    type: 'grammar',
    typeLabel: '单元语法',
    containerId: point.unitId,
    title: point.title,
    subtitle: `英语 · ${point.bookLabel} · ${point.unitTitle}`,
    description: point.summary,
    tags: (point.structures || []).slice(0, 3),
  }));

  return [...unitResults, ...wordResults, ...grammarResults].filter((item) => item.score > 0);
}

function searchPhysicsCurriculum(keyword) {
  const subjectId = 'physics';
  const subjectLabel = SUBJECT_LABELS.physics;
  const chapterResults = physicsCurriculum.chapters.map((chapter) => ({
    score: scoreContent(keyword, chapter.title, [
      chapter.chapterLabel,
      chapter.bookLabel,
      chapter.summary,
      ...(chapter.keywords || []),
      ...(chapter.signals || []),
      ...(chapter.formulas || []),
    ]),
    id: `chapter-physics-${chapter.id}`,
    refId: chapter.id,
    subjectId,
    subjectLabel,
    type: 'chapter',
    typeLabel: '教材章节',
    containerId: chapter.bookId,
    title: `${chapter.chapterLabel} ${chapter.title}`,
    subtitle: `物理 · ${chapter.bookLabel}`,
    description: chapter.summary,
    tags: (chapter.keywords || []).slice(0, 4),
  }));
  const knowledgeResults = physicsCurriculum.knowledgeItems.map((knowledge) => {
    const chapter = physicsCurriculum.getChapterById(knowledge.chapterId);
    return {
      score: scoreContent(keyword, knowledge.title, [
        knowledge.summary,
        ...(knowledge.tags || []),
        ...(knowledge.keywords || []),
        ...(knowledge.knowledgePoints || []),
        ...(knowledge.mistakeChecklist || []),
      ]),
      id: `knowledge-physics-${knowledge.id}`,
      refId: knowledge.id,
      subjectId,
      subjectLabel,
      type: 'knowledge',
      typeLabel: '知识点',
      containerId: knowledge.chapterId,
      title: knowledge.title,
      subtitle: `物理 · ${chapter ? `${chapter.chapterLabel} ${chapter.title}` : '教材章节'}`,
      description: knowledge.summary,
      tags: (knowledge.tags || []).slice(0, 4),
    };
  });
  const templateResults = physicsCurriculum.templates.map((template) => {
    const chapter = physicsCurriculum.getChapterById((template.chapterIds || [])[0]);
    return {
      score: scoreContent(keyword, template.name, [
        template.category,
        template.summary,
        ...(template.keywords || []),
        ...(template.cues || []),
        ...(template.steps || []),
        ...(template.pitfalls || []),
      ]),
      id: `template-physics-${template.id}`,
      refId: template.id,
      subjectId,
      subjectLabel,
      type: 'template',
      typeLabel: '方法模板',
      containerId: (template.chapterIds || [])[0] || '',
      title: template.name,
      subtitle: `物理 · ${chapter ? chapter.title : template.category}`,
      description: template.summary,
      tags: (template.keywords || []).slice(0, 4),
    };
  });

  return [...chapterResults, ...knowledgeResults, ...templateResults]
    .filter((item) => item.score > 0);
}

function searchMathWithTopics(keyword) {
  const baseResults = math.searchMath(keyword).map((item) => ({
    ...item,
    subjectId: 'math',
    subjectLabel: SUBJECT_LABELS.math,
    containerId: item.type === 'chapter' ? item.refId : '',
    score: 100,
  }));
  const topicResults = math.getMathStudyMap().topicGroups
    .flatMap((group) => group.topics)
    .map((topic) => ({
      score: scoreContent(keyword, topic.title, [topic.summary, ...(topic.focus || []), ...(topic.signals || [])]),
      id: `topic-math-${topic.id}`,
      refId: topic.id,
      subjectId: 'math',
      subjectLabel: SUBJECT_LABELS.math,
      type: 'topic',
      typeLabel: '专题',
      containerId: topic.id,
      title: topic.title,
      subtitle: `数学 · ${topic.stage || topic.gradeId}`,
      description: topic.summary,
      tags: (topic.focus || []).slice(0, 4),
    }))
    .filter((item) => item.score > 0);

  return [...baseResults, ...topicResults];
}

function searchAllSubjects(keyword, subjectId = 'all') {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase();

  if (!normalizedKeyword) {
    return [];
  }

  const selectedSubjects = subjectId === 'all'
    ? ['math', 'english', 'physics']
    : [normalizeSubjectId(subjectId)];
  const searchAliasMap = {
    阅读主旨: ['主旨', '篇章结构'],
    语境猜词: ['猜词', '上下文'],
    受力分析: ['受力', '平衡'],
    欧姆定律: ['欧姆', '电阻与电流'],
  };
  const keywords = [normalizedKeyword, ...(searchAliasMap[normalizedKeyword] || [])];
  const resultMap = new Map();

  keywords.forEach((searchKeyword) => {
    selectedSubjects.flatMap((id) => (
      id === 'math'
        ? searchMathWithTopics(searchKeyword)
        : id === 'english'
          ? [...searchEnglishUnits(searchKeyword), ...searchStructuredSubject(id, searchKeyword)]
          : [...searchPhysicsCurriculum(searchKeyword), ...searchStructuredSubject(id, searchKeyword)]
    )).forEach((item) => {
      if (!resultMap.has(item.id) || resultMap.get(item.id).score < item.score) {
        resultMap.set(item.id, item);
      }
    });
  });

  const results = [...resultMap.values()];

  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'zh-Hans-CN'))
    .map(({ score, ...item }) => item);
}

module.exports = {
  getSubjectRegistry,
  getSubjectMeta,
  getSubjectHome,
  getEnglishUnitById,
  getPhysicsChapterById,
  getTopicById,
  getKnowledgeById,
  getTemplateById,
  getKnowledgeContext,
  getRelatedKnowledge,
  searchAllSubjects,
  normalizeSubjectId,
  SUBJECT_LABELS,
};
