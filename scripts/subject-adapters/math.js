const math = require('../../packages/math/repository');

const subjectId = 'math';

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
  const chapters = math.getAllChapters();
  return [
    { type: 'chapter', entities: chapters },
    { type: 'topic', entities: math.getMathStudyMap().topicGroups.flatMap((group) => group.topics) },
    { type: 'knowledge', entities: chapters.flatMap((chapter) => chapter.knowledgeItems) },
    { type: 'template', entities: math.getAllTemplates() },
  ];
}

function buildSearchEntries(makeEntry) {
  const chapters = math.getAllChapters();
  const topics = math.getMathStudyMap().topicGroups.flatMap((group) => group.topics);
  const templates = math.getAllTemplates();
  const chapterEntries = chapters.map((chapter) => makeEntry({
    refId: chapter.id,
    subjectId,
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
    subjectId,
    type: 'knowledge',
    containerId: chapter.id,
    title: knowledge.title,
    subtitle: `数学 · ${chapter.stage} · ${chapter.title}`,
    description: knowledge.summary,
    tags: knowledge.tags,
    tokens: [
      knowledge.keywords,
      knowledge.mathDetail && knowledge.mathDetail.searchTerms,
      knowledge.mathDetail && knowledge.mathDetail.conditions,
      knowledge.mathDetail && knowledge.mathDetail.derivations.flatMap((item) => [item.steps, item.conclusion]),
      knowledge.mathDetail && knowledge.mathDetail.whyItWorks,
      knowledge.mathDetail && knowledge.mathDetail.connections.flatMap((item) => [item.title, item.description, item.keywords]),
      knowledge.knowledgePoints,
      knowledge.legacyIds,
    ],
  })));
  const topicEntries = topics.map((topic) => makeEntry({
    refId: topic.id,
    subjectId,
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
    subjectId,
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

function validate() {
  math.getAllChapters().forEach((chapter) => {
    chapter.knowledgeItems.forEach((knowledge) => {
      if (!knowledge.sections.find((section) => section.type === 'formula')) {
        throw new Error(`数学小节缺少公式区：${knowledge.id}`);
      }
    });
  });
}

function buildReferenceEntries() {
  validate();
  return math.getAllChapters().flatMap((chapter) => (
    chapter.knowledgeItems.map((knowledge) => {
      const formula = knowledge.sections.find((section) => section.type === 'formula');
      return {
        key: `${subjectId}:formula:${knowledge.id}`,
        kind: 'formula',
        subjectId,
        refId: knowledge.id,
        containerId: chapter.id,
        focusId: '',
        title: knowledge.title,
        subtitle: `数学 · ${chapter.stage} · ${chapter.title}`,
        primary: formula.formula,
        secondary: formula.description,
        tags: unique(knowledge.tags, 3),
        tokens: unique([
          knowledge.keywords,
          formula.conditions,
          knowledge.mathDetail && knowledge.mathDetail.searchTerms,
        ]),
      };
    })
  ));
}

module.exports = {
  subjectId,
  getManifestEntities,
  buildSearchEntries,
  buildReferenceEntries,
  validate,
};
