const { topics } = require('../../packages/biology/data/biology-topics');
const { knowledgeItems } = require('../../packages/biology/data/biology-knowledge');
const { templates } = require('../../packages/biology/data/biology-templates');

const subjectId = 'biology';

const SEARCH_ALIASES = {
  'bio-k-plant-animal-cells': ['细胞膜'],
  'bio-k-photosynthesis': ['光合作用'],
  'bio-k-digestion': ['消化系统'],
  'bio-k-ecosystem-structure': ['生态系统'],
  'bio-k-heredity-basics': ['遗传和变异'],
  'bio-k-variation': ['遗传和变异'],
  'bio-k-biodiversity-conservation': ['生物多样性'],
};

function compact(value, maxLength = 48) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function unique(values, maxItems = 8) {
  const seen = new Set();
  return values
    .flat(Infinity)
    .map((value) => compact(value))
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
    { type: 'topic', entities: topics },
    { type: 'knowledge', entities: knowledgeItems },
    { type: 'template', entities: templates },
  ];
}

function buildSearchEntries(makeEntry) {
  const topicEntries = topics.map((topic) => makeEntry({
    refId: topic.id,
    subjectId,
    type: 'topic',
    containerId: topic.id,
    title: topic.title,
    subtitle: `生物 · ${topic.unitLabel}`,
    description: topic.summary,
    tags: topic.keywords,
    tokens: [
      topic.knowledgeIds.map((id) => knowledgeItems.find((item) => item.id === id)).filter(Boolean).map((item) => item.title),
      topic.templateIds.map((id) => templates.find((item) => item.id === id)).filter(Boolean).map((item) => item.name),
    ],
  }));
  const knowledgeEntries = knowledgeItems.map((knowledge) => {
    const topic = topics.find((item) => item.id === knowledge.topicId);
    return makeEntry({
      refId: knowledge.id,
      subjectId,
      type: 'knowledge',
      containerId: knowledge.topicId,
      title: knowledge.title,
      subtitle: `生物 · ${topic ? topic.title : '知识点'}`,
      description: knowledge.summary,
      tags: knowledge.tags,
      tokens: unique([SEARCH_ALIASES[knowledge.id], knowledge.keywords]),
    });
  });
  const templateEntries = templates.map((template) => makeEntry({
    refId: template.id,
    subjectId,
    type: 'template',
    containerId: template.topicIds[0] || '',
    title: template.name,
    subtitle: `生物 · ${template.category}`,
    description: template.summary,
    tags: template.category ? [template.category] : [],
    tokens: unique(template.topicIds.map((id) => topics.find((item) => item.id === id)).filter(Boolean).map((item) => item.title)),
  }));

  return [...topicEntries, ...knowledgeEntries, ...templateEntries];
}

function getObservations() {
  return knowledgeItems.flatMap((knowledge) => (knowledge.safetyObservation
    ? [{ knowledge, observation: knowledge.safetyObservation }]
    : []));
}

function validate() {
  if (topics.length !== 6 || knowledgeItems.length !== 36 || templates.length !== 6) {
    throw new Error(`生物内容规模不正确：${topics.length}/${knowledgeItems.length}/${templates.length}`);
  }
  const topicIds = new Set(topics.map((topic) => topic.id));
  const templateIds = new Set(templates.map((template) => template.id));
  knowledgeItems.forEach((knowledge) => {
    if (knowledge.subjectId !== subjectId || !topicIds.has(knowledge.topicId)) {
      throw new Error(`生物知识归属无效：${knowledge.id}`);
    }
  });
  topics.forEach((topic) => {
    if (topic.subjectId !== subjectId
      || topic.knowledgeIds.some((id) => !knowledgeItems.some((item) => item.id === id))
      || topic.templateIds.some((id) => !templateIds.has(id))) {
      throw new Error(`生物专题引用无效：${topic.id}`);
    }
  });
  const observations = getObservations();
  if (observations.length !== 6 || observations.some(({ observation }) => !observation.id)) {
    throw new Error('生物观察记录或稳定 ID 无效');
  }
}

function buildReferenceEntries() {
  validate();
  return getObservations().map(({ knowledge, observation }) => ({
    key: `${subjectId}:experiment:${observation.id}`,
    kind: 'experiment',
    subjectId,
    refId: knowledge.id,
    containerId: knowledge.topicId,
    focusId: observation.id,
    title: knowledge.title,
    subtitle: '生物 · 受控观察',
    primary: compact(observation.context, 120),
    secondary: '受控观察提醒',
    tags: unique(knowledge.tags, 3),
    tokens: unique([knowledge.title, knowledge.keywords], 6),
  }));
}

module.exports = {
  subjectId,
  getManifestEntities,
  buildSearchEntries,
  buildReferenceEntries,
  validate,
};
