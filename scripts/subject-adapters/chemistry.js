const { themes } = require('../../packages/chemistry/data/chemistry-themes');
const { topics } = require('../../packages/chemistry/data/chemistry-topics');
const { templates } = require('../../packages/chemistry/data/chemistry-templates');
const {
  getChemistryEquations,
  getChemistryExperiments,
  knowledgeItems,
} = require('../../packages/chemistry/data/chemistry-knowledge');

const subjectId = 'chemistry';

const SEARCH_ALIASES = {
  'chem-k-oxygen-preparation': ['氧气制取', '实验室制氧气'],
  'chem-k-carbon-dioxide-lab': ['二氧化碳检验', '实验室制二氧化碳'],
  'chem-k-common-salts': ['粗盐提纯'],
  'chem-k-combustion-catalyst': ['燃烧条件'],
  'chem-tpl-equation-balancing': ['化学方程式配平'],
};

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

function sectionTokens(section) {
  if (!section) return [];
  return [
    section.title,
    section.equation,
    section.condition,
    section.phenomenon,
    section.interpretation,
    section.purpose,
    section.apparatus,
    section.conclusion,
    section.risks,
    section.rules,
  ];
}

function getManifestEntities() {
  return [
    { type: 'theme', entities: themes },
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
    subtitle: '化学 · 九年级专题',
    description: topic.summary,
    tags: topic.keywords,
    tokens: [
      topic.objective,
      topic.knowledgeIds.map((id) => knowledgeItems.find((item) => item.id === id)).filter(Boolean).map((item) => item.title),
      topic.templateIds.map((id) => templates.find((item) => item.id === id)).filter(Boolean).map((item) => item.name),
    ],
  }));
  const knowledgeEntries = knowledgeItems.map((knowledge) => makeEntry({
    refId: knowledge.id,
    subjectId,
    type: 'knowledge',
    containerId: knowledge.topicId,
    title: knowledge.title,
    subtitle: '化学 · 九年级',
    description: knowledge.summary,
    tags: knowledge.tags,
    tokens: [
      SEARCH_ALIASES[knowledge.id],
      knowledge.keywords,
      knowledge.knowledgePoints,
      (knowledge.sections || []).flatMap(sectionTokens),
    ],
  }));
  const templateEntries = templates.map((template) => makeEntry({
    refId: template.id,
    subjectId,
    type: 'template',
    containerId: (template.topicIds || [])[0] || '',
    title: template.name,
    subtitle: `化学 · ${template.category}`,
    description: template.summary,
    tags: template.keywords,
    tokens: [
      SEARCH_ALIASES[template.id],
      template.cues,
      (template.steps || []).map((item) => item.action),
      (template.examples || []).flatMap((item) => [item.scenario, item.conclusion]),
    ],
  }));

  return [...topicEntries, ...knowledgeEntries, ...templateEntries];
}

function collectOwnedSections(type, idField) {
  const records = new Map();
  knowledgeItems.forEach((knowledge) => {
    (knowledge.sections || [])
      .filter((section) => section.type === type)
      .forEach((section) => {
        if (!records.has(section[idField])) {
          records.set(section[idField], { section, knowledge });
        }
      });
  });
  return [...records.values()];
}

function validate() {
  const expectedCounts = [themes.length, topics.length, knowledgeItems.length, templates.length];
  if (expectedCounts.join(',') !== '5,10,40,12') {
    throw new Error(`化学内容规模不正确：${expectedCounts.join(',')}`);
  }
  const topicIds = new Set(topics.map((item) => item.id));
  const knowledgeIds = new Set(knowledgeItems.map((item) => item.id));
  const templateIds = new Set(templates.map((item) => item.id));
  knowledgeItems.forEach((knowledge) => {
    if (knowledge.subjectId !== subjectId || !topicIds.has(knowledge.topicId)) {
      throw new Error(`化学知识归属无效：${knowledge.id}`);
    }
  });
  topics.forEach((topic) => {
    if (topic.subjectId !== subjectId
      || topic.knowledgeIds.some((id) => !knowledgeIds.has(id))
      || topic.templateIds.some((id) => !templateIds.has(id))) {
      throw new Error(`化学专题引用无效：${topic.id}`);
    }
  });
  if (collectOwnedSections('experiment', 'experimentId').length !== getChemistryExperiments().length
    || getChemistryExperiments().length !== 8) {
    throw new Error('化学实验引用或去重结果无效');
  }
  if (collectOwnedSections('equation', 'equationId').length !== getChemistryEquations().length
    || getChemistryEquations().length !== 28) {
    throw new Error('化学方程式引用或去重结果无效');
  }
}

function buildReferenceEntries() {
  validate();
  const experimentEntries = collectOwnedSections('experiment', 'experimentId').map(({ section, knowledge }) => ({
    key: `${subjectId}:experiment:${section.experimentId}`,
    kind: 'experiment',
    subjectId,
    refId: knowledge.id,
    containerId: knowledge.topicId,
    focusId: section.experimentId,
    title: section.title,
    subtitle: '化学 · 九年级',
    primary: section.purpose,
    secondary: section.conclusion,
    tags: unique(knowledge.tags, 1),
    tokens: unique([
      SEARCH_ALIASES[knowledge.id],
      knowledge.title,
      section.apparatus,
      section.phenomenon,
      section.conclusion,
    ], 2),
  }));
  const equationEntries = collectOwnedSections('equation', 'equationId').map(({ section, knowledge }) => ({
    key: `${subjectId}:equation:${section.equationId}`,
    kind: 'equation',
    subjectId,
    refId: knowledge.id,
    containerId: knowledge.topicId,
    focusId: section.equationId,
    title: section.title,
    subtitle: '化学 · 九年级',
    primary: section.equation,
    secondary: compact(section.condition),
    tags: unique(knowledge.tags, 1),
    tokens: unique([
      SEARCH_ALIASES[knowledge.id],
      knowledge.title,
      section.condition,
      section.phenomenon,
      section.interpretation,
    ], 2),
  }));

  return [...experimentEntries, ...equationEntries];
}

module.exports = {
  subjectId,
  getManifestEntities,
  buildSearchEntries,
  buildReferenceEntries,
  validate,
};
