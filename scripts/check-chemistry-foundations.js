const assert = require('assert');

const { themes } = require('../packages/chemistry/data/chemistry-themes');
const { topics } = require('../packages/chemistry/data/chemistry-topics');
const { templates } = require('../packages/chemistry/data/chemistry-templates');
const { foundationKnowledge } = require('../packages/chemistry/data/chemistry-knowledge-foundations');
const { knowledgeItems } = require('../packages/chemistry/data/chemistry-knowledge');
const {
  buildTheme,
  buildTopic,
  buildTemplate,
  buildKnowledge,
} = require('../packages/chemistry/data/chemistry-builders');

const THEME_IDS = [
  'chem-theme-inquiry',
  'chem-theme-properties',
  'chem-theme-structure',
  'chem-theme-change',
  'chem-theme-society',
];

const TOPIC_CONTRACT = [
  {
    id: 'chem-topic-lab',
    title: '走进化学与实验安全',
    themeId: 'chem-theme-inquiry',
    knowledgeIds: [
      'chem-k-lab-object-change',
      'chem-k-lab-instruments',
      'chem-k-lab-operations',
      'chem-k-lab-inquiry',
    ],
    templateIds: [
      'chem-tpl-observation',
      'chem-tpl-instrument-reading',
      'chem-tpl-experiment-design',
    ],
  },
  {
    id: 'chem-topic-air-oxygen',
    title: '空气、氧气与燃烧',
    themeId: 'chem-theme-properties',
    knowledgeIds: [
      'chem-k-air-composition',
      'chem-k-oxygen-properties',
      'chem-k-oxygen-preparation',
      'chem-k-combustion-catalyst',
    ],
    templateIds: [
      'chem-tpl-observation',
      'chem-tpl-gas-apparatus',
      'chem-tpl-gas-collection-test',
      'chem-tpl-experiment-design',
    ],
  },
  {
    id: 'chem-topic-water-solution',
    title: '水与溶液',
    themeId: 'chem-theme-properties',
    knowledgeIds: [
      'chem-k-water-composition',
      'chem-k-water-purification',
      'chem-k-dissolution-solubility',
      'chem-k-solution-concentration',
    ],
    templateIds: [
      'chem-tpl-solubility-curve',
      'chem-tpl-mass-fraction',
      'chem-tpl-solution-preparation',
      'chem-tpl-experiment-design',
    ],
  },
  {
    id: 'chem-topic-particles-elements',
    title: '分子、原子、离子与元素',
    themeId: 'chem-theme-structure',
    knowledgeIds: [
      'chem-k-particles',
      'chem-k-atomic-structure',
      'chem-k-elements-periodic-table',
      'chem-k-formula-valence',
    ],
    templateIds: ['chem-tpl-valence-formula'],
  },
  {
    id: 'chem-topic-language-conservation',
    title: '化学用语与质量守恒',
    themeId: 'chem-theme-change',
    knowledgeIds: [
      'chem-k-symbols-formulas',
      'chem-k-mass-conservation',
      'chem-k-equations',
      'chem-k-stoichiometry',
    ],
    templateIds: [
      'chem-tpl-valence-formula',
      'chem-tpl-equation-balancing',
      'chem-tpl-mass-conservation',
      'chem-tpl-stoichiometry',
    ],
  },
  {
    id: 'chem-topic-carbon-fuels',
    title: '碳及其化合物与燃料',
    themeId: 'chem-theme-properties',
    knowledgeIds: [
      'chem-k-carbon-allotropes',
      'chem-k-carbon-oxides',
      'chem-k-carbon-dioxide-lab',
      'chem-k-fuels-energy',
    ],
    templateIds: [
      'chem-tpl-observation',
      'chem-tpl-gas-apparatus',
      'chem-tpl-gas-collection-test',
      'chem-tpl-equation-balancing',
    ],
  },
  {
    id: 'chem-topic-metals',
    title: '金属与金属材料',
    themeId: 'chem-theme-properties',
    knowledgeIds: [
      'chem-k-metal-properties',
      'chem-k-metal-activity',
      'chem-k-metal-extraction',
      'chem-k-metal-corrosion',
    ],
    templateIds: [
      'chem-tpl-observation',
      'chem-tpl-equation-balancing',
      'chem-tpl-experiment-design',
    ],
  },
  {
    id: 'chem-topic-acids-bases',
    title: '常见的酸和碱',
    themeId: 'chem-theme-properties',
    knowledgeIds: [
      'chem-k-indicators-ph',
      'chem-k-common-acids',
      'chem-k-common-bases',
      'chem-k-neutralization',
    ],
    templateIds: [
      'chem-tpl-observation',
      'chem-tpl-equation-balancing',
      'chem-tpl-experiment-design',
    ],
  },
  {
    id: 'chem-topic-salts-fertilizers',
    title: '盐、化肥与常见离子反应',
    themeId: 'chem-theme-properties',
    knowledgeIds: [
      'chem-k-common-salts',
      'chem-k-ion-reactions',
      'chem-k-fertilizers',
      'chem-k-substance-classification',
    ],
    templateIds: [
      'chem-tpl-observation',
      'chem-tpl-equation-balancing',
      'chem-tpl-experiment-design',
    ],
  },
  {
    id: 'chem-topic-materials-environment',
    title: '化学材料、资源与环境',
    themeId: 'chem-theme-society',
    knowledgeIds: [
      'chem-k-organic-basics',
      'chem-k-materials',
      'chem-k-chemical-health',
      'chem-k-resources-environment',
    ],
    templateIds: ['chem-tpl-observation', 'chem-tpl-experiment-design'],
  },
];

const TEMPLATE_IDS = [
  'chem-tpl-observation',
  'chem-tpl-instrument-reading',
  'chem-tpl-gas-apparatus',
  'chem-tpl-gas-collection-test',
  'chem-tpl-valence-formula',
  'chem-tpl-equation-balancing',
  'chem-tpl-mass-conservation',
  'chem-tpl-stoichiometry',
  'chem-tpl-solubility-curve',
  'chem-tpl-mass-fraction',
  'chem-tpl-solution-preparation',
  'chem-tpl-experiment-design',
];

const FOUNDATION_IDS = TOPIC_CONTRACT.slice(0, 5).flatMap((topic) => topic.knowledgeIds);
const EXPERIMENT_IDS = [
  'chem-exp-oxygen',
  'chem-exp-sodium-chloride-solution',
  'chem-exp-water-composition',
  'chem-exp-combustion-conditions',
];
const EXPERIMENT_TITLES = {
  'chem-exp-oxygen': '氧气的实验室制取与性质',
  'chem-exp-sodium-chloride-solution': '一定溶质质量分数的氯化钠溶液的配制',
  'chem-exp-water-composition': '水的组成及变化的探究',
  'chem-exp-combustion-conditions': '燃烧条件的探究',
};
const SOURCE_KEYS = [
  'moe-chemistry-2022',
  'moe-textbook-catalog-2024',
  'pep-chemistry-training-2024',
];
const FORBIDDEN_FIELDS = new Set([
  'assessment',
  'assessments',
  'answerSubmission',
  'checkpoint',
  'checkpoints',
  'finishCriteria',
  'outputTask',
  'outputTasks',
  'problem',
  'problems',
  'progress',
  'quiz',
  'quizzes',
  'score',
]);

function assertNonemptyString(value, label) {
  assert.strictEqual(typeof value, 'string', `${label} must be a string`);
  assert(value.trim(), `${label} must not be empty`);
}

function assertReviewMeta(entity, label) {
  assert.strictEqual(entity.subjectId, 'chemistry', `${label} subjectId`);
  assert(entity.contentMeta, `${label} contentMeta`);
  assert.strictEqual(entity.contentMeta.status, 'verified', `${label} review status`);
  assert.strictEqual(entity.contentMeta.reviewedAt, '2026-08-01', `${label} reviewedAt`);
  assert.deepStrictEqual(entity.contentMeta.sourceKeys, SOURCE_KEYS, `${label} source keys`);
  assert(Array.isArray(entity.contentMeta.sourceRefs) && entity.contentMeta.sourceRefs.length === 3, `${label} source refs`);
}

function rejectForbiddenFields(value, path = 'chemistry') {
  if (!value || typeof value !== 'object') return;

  Object.keys(value).forEach((key) => {
    assert(!FORBIDDEN_FIELDS.has(key), `${path}.${key} is forbidden`);
    rejectForbiddenFields(value[key], `${path}.${key}`);
  });
}

function collectSections(type) {
  return foundationKnowledge.flatMap((item) => item.sections.filter((section) => section.type === type));
}

assert.strictEqual(themes.length, 5);
assert.strictEqual(topics.length, 10);
assert.strictEqual(templates.length, 12);
assert.strictEqual(foundationKnowledge.length, 20);
assert.strictEqual(knowledgeItems.length, 20);

assert.deepStrictEqual(themes.map((item) => item.id), THEME_IDS);
assert.deepStrictEqual(topics.map((item) => item.id), TOPIC_CONTRACT.map((item) => item.id));
assert.deepStrictEqual(templates.map((item) => item.id), TEMPLATE_IDS);
assert.deepStrictEqual(foundationKnowledge.map((item) => item.id), FOUNDATION_IDS);
assert.deepStrictEqual(knowledgeItems.map((item) => item.id), FOUNDATION_IDS);

const topicIds = new Set(TOPIC_CONTRACT.map((item) => item.id));
const templateIds = new Set(TEMPLATE_IDS);
const knowledgeIds = new Set(FOUNDATION_IDS);

themes.forEach((theme) => {
  assertReviewMeta(theme, theme.id);
  assertNonemptyString(theme.title, `${theme.id}.title`);
  assertNonemptyString(theme.summary, `${theme.id}.summary`);
  assert(Array.isArray(theme.topicIds) && theme.topicIds.length >= 1, `${theme.id}.topicIds`);
  theme.topicIds.forEach((id) => assert(topicIds.has(id), `${theme.id} unknown topic ${id}`));
});
assert.strictEqual(new Set(themes.flatMap((theme) => theme.topicIds)).size, 10, 'themes must cover all topics');

topics.forEach((topic, index) => {
  const expected = TOPIC_CONTRACT[index];
  assertReviewMeta(topic, topic.id);
  assert.strictEqual(topic.title, expected.title, `${topic.id}.title`);
  assert.strictEqual(topic.themeId, expected.themeId, `${topic.id}.themeId`);
  assert.deepStrictEqual(topic.gradeBands, ['九年级'], `${topic.id}.gradeBands`);
  assertNonemptyString(topic.summary, `${topic.id}.summary`);
  assertNonemptyString(topic.objective, `${topic.id}.objective`);
  assert(Array.isArray(topic.keywords) && topic.keywords.length >= 3, `${topic.id}.keywords`);
  assert.deepStrictEqual(topic.knowledgeIds, expected.knowledgeIds, `${topic.id}.knowledgeIds`);
  assert.deepStrictEqual(topic.templateIds, expected.templateIds, `${topic.id}.templateIds`);
  assert.deepStrictEqual(topic.textbookMappings, [], `${topic.id}.textbookMappings`);
  assert.strictEqual(
    topic.coverImage,
    `/assets/figures/generated/chemistry/topics/${topic.id}/cover.png`,
    `${topic.id}.coverImage`,
  );
});

templates.forEach((template) => {
  assertReviewMeta(template, template.id);
  assert.strictEqual(template.name, template.title, `${template.id}.name`);
  assert(Array.isArray(template.topicIds) && template.topicIds.length >= 1, `${template.id}.topicIds`);
  template.topicIds.forEach((id) => assert(topicIds.has(id), `${template.id} unknown topic ${id}`));
  assertNonemptyString(template.category, `${template.id}.category`);
  assertNonemptyString(template.summary, `${template.id}.summary`);
  assert(Array.isArray(template.keywords) && template.keywords.length >= 3, `${template.id}.keywords`);
  assert(Array.isArray(template.cues) && template.cues.length >= 2, `${template.id}.cues`);
  assert(Array.isArray(template.steps) && template.steps.length >= 4, `${template.id}.steps`);
  template.steps.forEach((step, index) => {
    assert.strictEqual(step.order, index + 1, `${template.id}.steps order`);
    assertNonemptyString(step.action, `${template.id}.steps[${index}].action`);
  });
  assert(Array.isArray(template.pitfalls) && template.pitfalls.length >= 2, `${template.id}.pitfalls`);
  assert(Array.isArray(template.examples) && template.examples.length >= 1, `${template.id}.examples`);
  template.examples.forEach((example, index) => {
    assertNonemptyString(example.scenario, `${template.id}.examples[${index}].scenario`);
    assert(Array.isArray(example.steps) && example.steps.length >= 2, `${template.id}.examples[${index}].steps`);
    assertNonemptyString(example.conclusion, `${template.id}.examples[${index}].conclusion`);
  });
  assert.strictEqual(
    template.figure,
    `/assets/figures/generated/chemistry/templates/${template.id}.png`,
    `${template.id}.figure`,
  );
});

foundationKnowledge.forEach((item) => {
  assertReviewMeta(item, item.id);
  assert(topicIds.has(item.topicId), `${item.id} unknown topic ${item.topicId}`);
  assertNonemptyString(item.title, `${item.id}.title`);
  assertNonemptyString(item.summary, `${item.id}.summary`);
  assertNonemptyString(item.boundary, `${item.id}.boundary`);
  assert(Array.isArray(item.tags) && item.tags.length >= 2, `${item.id}.tags`);
  assert(Array.isArray(item.keywords) && item.keywords.length >= 3, `${item.id}.keywords`);
  assert(Array.isArray(item.knowledgePoints) && item.knowledgePoints.length >= 3, `${item.id}.knowledgePoints`);
  assert(Array.isArray(item.sections) && item.sections.length >= 2, `${item.id}.sections`);
  const examples = item.sections.filter((section) => section.type === 'example');
  assert(examples.length >= 1, `${item.id} needs a worked example section`);
  examples.forEach((example, index) => {
    assertNonemptyString(example.scenario, `${item.id}.example[${index}].scenario`);
    assert(Array.isArray(example.steps) && example.steps.length >= 2, `${item.id}.example[${index}].steps`);
    assertNonemptyString(example.conclusion, `${item.id}.example[${index}].conclusion`);
  });
  assert(Array.isArray(item.templateIds) && item.templateIds.length >= 1, `${item.id}.templateIds`);
  item.templateIds.forEach((id) => assert(templateIds.has(id), `${item.id} unknown template ${id}`));
  assert(Array.isArray(item.relatedIds) && item.relatedIds.length === 2, `${item.id}.relatedIds`);
  item.relatedIds.forEach((id) => assert(knowledgeIds.has(id) && id !== item.id, `${item.id} invalid related ID ${id}`));
  assert(
    /^\/assets\/figures\/generated\/chemistry\/topics\/chem-topic-[^/]+\/cover\.png$/.test(item.coverImage),
    `${item.id}.coverImage must be a cloud path`,
  );
});

foundationKnowledge.forEach((item) => {
  item.relatedIds.forEach((relatedId) => {
    const related = foundationKnowledge.find((candidate) => candidate.id === relatedId);
    assert(related.relatedIds.includes(item.id), `${item.id} -> ${relatedId} must be reciprocal`);
  });
});

const knowledgeById = new Map(foundationKnowledge.map((item) => [item.id, item]));
const REQUIRED_SCOPE_TEXT = {
  'chem-k-lab-object-change': ['实验探究', '模型建构', '化学发展史', '技术', '社会', '环境'],
  'chem-k-lab-inquiry': ['提出问题', '假设', '设计', '证据', '结论', '交流', '反思', '科学态度', '责任'],
  'chem-k-water-composition': ['制氢', '储氢', '燃料电池', '氢能'],
  'chem-k-solution-concentration': ['物质的量浓度', '摩尔浓度'],
  'chem-k-atomic-structure': ['电子排布', '轨道', '量子数', '同位素丰度'],
  'chem-k-elements-periodic-table': ['周期律', '价电子'],
  'chem-k-equations': ['离子方程式', '电极反应'],
  'chem-k-stoichiometry': ['物质的量', '限量试剂', '产率'],
};
Object.entries(REQUIRED_SCOPE_TEXT).forEach(([id, fragments]) => {
  const content = JSON.stringify(knowledgeById.get(id));
  fragments.forEach((fragment) => assert(content.includes(fragment), `${id} must cover boundary/responsibility: ${fragment}`));
});
const foundationText = JSON.stringify(foundationKnowledge);
assert(!foundationText.includes('各处甜味'), 'solution examples must not imply tasting laboratory materials');
assert(!foundationText.includes('SO4 2-'), 'ion charges must not use ambiguous spaced notation');

const experiments = collectSections('experiment');
assert.strictEqual(experiments.length, 4, 'foundation experiment count');
assert.deepStrictEqual(experiments.map((item) => item.experimentId).sort(), [...EXPERIMENT_IDS].sort());
experiments.forEach((experiment) => {
  assert.strictEqual(experiment.primary, true, `${experiment.experimentId}.primary`);
  assert.strictEqual(experiment.title, EXPERIMENT_TITLES[experiment.experimentId], `${experiment.experimentId}.title`);
  ['purpose', 'phenomenon', 'conclusion', 'safety'].forEach((field) => {
    assertNonemptyString(experiment[field], `${experiment.experimentId}.${field}`);
  });
  ['apparatus', 'steps', 'errors'].forEach((field) => {
    assert(Array.isArray(experiment[field]) && experiment[field].length >= 2, `${experiment.experimentId}.${field}`);
  });
  assert(/教师|护目镜|禁止|不得/.test(experiment.safety), `${experiment.experimentId}.safety must be concrete`);
});

const equations = collectSections('equation');
assert(equations.length >= 10, `expected at least 10 equations, found ${equations.length}`);
assert.strictEqual(new Set(equations.map((item) => item.equationId)).size, equations.length, 'equation IDs must be unique');
equations.forEach((equation) => {
  assertNonemptyString(equation.equationId, 'equation.equationId');
  assertNonemptyString(equation.equation, `${equation.equationId}.equation`);
  assert(equation.equation.includes('->'), `${equation.equationId}.equation must use searchable ->`);
  assertNonemptyString(equation.condition, `${equation.equationId}.condition`);
  assert(
    (typeof equation.phenomenon === 'string' && equation.phenomenon.trim())
      || (typeof equation.interpretation === 'string' && equation.interpretation.trim()),
    `${equation.equationId} needs phenomenon or interpretation`,
  );
});

const allEntities = [...themes, ...topics, ...templates, ...foundationKnowledge];
for (let index = 1; index < allEntities.length; index += 1) {
  assert.notStrictEqual(allEntities[index - 1].contentMeta, allEntities[index].contentMeta, 'contentMeta must be cloned');
  assert.notStrictEqual(
    allEntities[index - 1].contentMeta.sourceRefs,
    allEntities[index].contentMeta.sourceRefs,
    'contentMeta sourceRefs must be cloned',
  );
}

assert.throws(() => buildTheme({ id: 'chem-theme-test' }), /title/);
assert.throws(() => buildTopic({ id: 'chem-topic-test', title: '测试专题' }), /themeId/);
assert.throws(() => buildTemplate({ id: 'chem-tpl-test', title: '测试方法' }), /topicIds/);
assert.throws(() => buildKnowledge({ id: 'chem-k-test', title: '测试知识' }), /topicId/);

rejectForbiddenFields({ themes, topics, templates, foundationKnowledge });

console.log(
  `OK chemistry foundations: ${themes.length} themes, ${topics.length} topics, `
    + `${templates.length} templates, ${foundationKnowledge.length} foundation knowledge items, `
    + `${experiments.length} experiments, ${equations.length} equations`,
);
