const physicsContent = require('../../packages/physics/data/physics-content');
const physicsCurriculum = require('../../packages/physics/data/physics-curriculum');
const physicsRepository = require('../../packages/physics/repository');

const subjectId = 'physics';

function compact(value, maxLength = 160) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function unique(values, maxItems = 18) {
  const seen = new Set();
  return values
    .flat(Infinity)
    .map((value) => compact(value, 90))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxItems);
}

function getManifestEntities() {
  return [
    { type: 'chapter', entities: physicsCurriculum.chapters },
    { type: 'knowledge', entities: physicsCurriculum.knowledgeItems },
    { type: 'template', entities: physicsCurriculum.templates },
    { type: 'topic', entities: physicsContent.topics.map((topic) => physicsRepository.getTopicById('physics', topic.id)) },
    { type: 'structured-knowledge', entities: physicsContent.knowledgeItems },
    { type: 'structured-template', entities: physicsContent.templates },
  ];
}

function buildSearchEntries(makeEntry) {
  const chapterEntries = physicsCurriculum.chapters.map((chapter) => makeEntry({
    refId: chapter.id,
    subjectId,
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
      subjectId,
      type: 'knowledge',
      containerId: knowledge.chapterId,
      title: knowledge.title,
      subtitle: `物理 · ${chapter ? `${chapter.chapterLabel} ${chapter.title}` : '教材章节'}`,
      description: knowledge.summary,
      tags: knowledge.tags,
      tokens: [
        knowledge.physicsDetail && knowledge.physicsDetail.quantities.map((item) => `${item.name} ${item.symbol} ${item.unit}`),
        knowledge.physicsDetail && knowledge.physicsDetail.conditions,
        knowledge.physicsDetail && knowledge.physicsDetail.directionRules,
        knowledge.keywords,
        knowledge.knowledgePoints,
        knowledge.sections && knowledge.sections.flatMap((section) => [section.formula, section.method, section.controls, section.records]),
      ],
    });
  });
  const templateEntries = physicsCurriculum.templates.map((template) => {
    const chapter = physicsCurriculum.getChapterById((template.chapterIds || [])[0]);
    return makeEntry({
      refId: template.id,
      subjectId,
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
    subjectId,
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
      subjectId,
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
    subjectId,
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

function validate() {
  physicsCurriculum.knowledgeItems.forEach((knowledge) => {
    const chapter = physicsCurriculum.getChapterById(knowledge.chapterId);
    const formula = knowledge.sections.find((section) => section.type === 'formula');
    if (!chapter || !formula) {
      throw new Error(`物理知识点缺少章节或公式区：${knowledge.id}`);
    }
  });
}

function buildReferenceEntries() {
  validate();
  const formulaEntries = physicsCurriculum.knowledgeItems.map((knowledge) => {
    const chapter = physicsCurriculum.getChapterById(knowledge.chapterId);
    const formula = knowledge.sections.find((section) => section.type === 'formula');
    return {
      key: `${subjectId}:formula:${knowledge.id}`,
      kind: 'formula',
      subjectId,
      refId: knowledge.id,
      containerId: chapter.id,
      focusId: '',
      title: knowledge.title,
      subtitle: `物理 · ${chapter.bookLabel} · ${chapter.title}`,
      primary: formula.formula,
      secondary: formula.unitNote || formula.description,
      tags: unique(knowledge.tags, 3),
      tokens: unique([
        knowledge.keywords,
        formula.conditions,
        formula.directionRules,
        formula.quantities && formula.quantities.flatMap((item) => [item.name, item.symbol, item.unit]),
      ]),
    };
  });
  const experimentEntries = physicsCurriculum.knowledgeItems.flatMap((knowledge) => {
    const chapter = physicsCurriculum.getChapterById(knowledge.chapterId);
    return knowledge.sections
      .filter((section) => section.type === 'experiment')
      .map((experiment) => ({
        key: `${subjectId}:experiment:${experiment.experimentId}`,
        kind: 'experiment',
        subjectId,
        refId: knowledge.id,
        containerId: knowledge.chapterId,
        focusId: experiment.experimentId,
        title: experiment.title,
        subtitle: `物理 · ${chapter.bookLabel} · ${chapter.title}`,
        primary: experiment.method,
        secondary: experiment.goal,
        tags: unique([knowledge.tags, experiment.controls], 3),
        tokens: unique([
          knowledge.title,
          experiment.apparatus,
          experiment.phenomenon,
          experiment.conclusion,
          experiment.records,
        ]),
      }));
  });

  return [...formulaEntries, ...experimentEntries];
}

module.exports = {
  subjectId,
  getManifestEntities,
  buildSearchEntries,
  buildReferenceEntries,
  validate,
};
