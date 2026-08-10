const assert = require('assert');
const { themes } = require('../packages/chemistry/data/chemistry-themes');
const { topics } = require('../packages/chemistry/data/chemistry-topics');
const { templates } = require('../packages/chemistry/data/chemistry-templates');
const chemistryKnowledge = require('../packages/chemistry/data/chemistry-knowledge');
const { collectChemistryVisualGuideIssues } = require('./chemistry-visual-guide-contract');
const chemistryRepository = require('../packages/chemistry/repository');

const EXPECTED_KNOWLEDGE_IDS = topics.flatMap((topic) => topic.knowledgeIds);
const EXPECTED_EXPERIMENT_IDS = [
  'chem-exp-coarse-salt',
  'chem-exp-oxygen',
  'chem-exp-carbon-dioxide',
  'chem-exp-metals',
  'chem-exp-acids-bases',
  'chem-exp-sodium-chloride-solution',
  'chem-exp-water-composition',
  'chem-exp-combustion-conditions',
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
const FORBIDDEN_CONTENT = [
  '题目',
  '题给',
  '题意',
  '题设',
  '作答',
  '答题',
  '练习要求',
  '习题',
  '试题',
  '测验',
  '自测',
  '考试',
  '得分',
  '提交答案',
  '学完自测',
  '输出任务',
  '闯关',
  '掌握度',
];

function assertText(value, label) {
  assert.strictEqual(typeof value, 'string', `${label} must be a string`);
  assert(value.trim(), `${label} must not be empty`);
}

function rejectForbidden(value, path = 'chemistry') {
  if (typeof value === 'string') {
    FORBIDDEN_CONTENT.forEach((wording) => {
      assert(!value.includes(wording), `${path} contains forbidden wording: ${wording}`);
    });
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, child]) => {
    assert(!FORBIDDEN_FIELDS.has(key), `${path}.${key} is forbidden`);
    rejectForbidden(child, `${path}.${key}`);
  });
}

function assertSection(section, label) {
  assertText(section.type, `${label}.type`);
  assertText(section.title, `${label}.title`);

  if (section.type === 'text' || section.type === 'tip' || section.type === 'safety') {
    const content = section.content || section.emergencyNote;
    assertText(content, `${label}.content`);
    return;
  }
  if (section.type === 'example') {
    assertText(section.scenario, `${label}.scenario`);
    assert(Array.isArray(section.steps) && section.steps.length >= 2, `${label}.steps`);
    section.steps.forEach((step, index) => assertText(step, `${label}.steps[${index}]`));
    assertText(section.conclusion, `${label}.conclusion`);
    return;
  }
  if (section.type === 'equation') {
    ['equationId', 'equation', 'condition', 'interpretation', 'ratioNote'].forEach((field) => {
      assertText(section[field], `${label}.${field}`);
    });
    assert.strictEqual(typeof section.phenomenon, 'string', `${label}.phenomenon`);
    return;
  }
  if (section.type === 'experiment') {
    ['experimentId', 'purpose', 'phenomenon', 'conclusion', 'safety'].forEach((field) => {
      assertText(section[field], `${label}.${field}`);
    });
    ['apparatus', 'steps', 'errors'].forEach((field) => {
      assert(Array.isArray(section[field]) && section[field].length >= 2, `${label}.${field}`);
    });
    assert.strictEqual(section.primary, true, `${label}.primary`);
    return;
  }
  if (section.type === 'comparison') {
    assert(Array.isArray(section.columns) && section.columns.length >= 2, `${label}.columns`);
    assert(Array.isArray(section.rows) && section.rows.length >= 2, `${label}.rows`);
    return;
  }
  if (section.type === 'list') {
    assert(Array.isArray(section.items) && section.items.length >= 2, `${label}.items`);
    return;
  }
  assert.fail(`${label} has unsupported section type ${section.type}`);
}

function assertRawSectionUniqueness(rawEquations, rawExperiments) {
  assert.strictEqual(
    new Set(rawEquations.map((item) => item.equationId)).size,
    rawEquations.length,
    'raw equation IDs must be unique before runtime deduplication',
  );
  assert.strictEqual(
    new Set(rawEquations.map((item) => item.equation)).size,
    rawEquations.length,
    'raw equation strings must be unique before runtime deduplication',
  );
  assert.strictEqual(
    new Set(rawExperiments.map((item) => item.experimentId)).size,
    rawExperiments.length,
    'raw experiment IDs must be unique before runtime deduplication',
  );
}

function withInjectedRawSection(section, callback) {
  knowledgeItems.push({
    id: 'chem-k-validator-fixture',
    sections: [section],
  });
  try {
    callback();
  } finally {
    knowledgeItems.pop();
  }
}

const { knowledgeItems } = chemistryKnowledge;
assert.strictEqual(themes.length, 5, 'chemistry theme count');
assert.strictEqual(topics.length, 10, 'chemistry topic count');
assert.strictEqual(templates.length, 12, 'chemistry template count');
assert.strictEqual(knowledgeItems.length, 40, 'chemistry knowledge count');
assert.deepStrictEqual(knowledgeItems.map((item) => item.id), EXPECTED_KNOWLEDGE_IDS);
assert.strictEqual(
  Object.keys(require('../packages/chemistry/data/chemistry-visual-guides').visualGuidesByKnowledgeId).length,
  knowledgeItems.length,
  'chemistry visual guide coverage',
);
assert.deepStrictEqual(
  collectChemistryVisualGuideIssues({
    sourceKnowledgeItems: knowledgeItems,
    runtimeLayers: [{
      label: 'repository',
      knowledgeItems: knowledgeItems.map((item) => chemistryRepository.getKnowledgeById(item.id)),
    }],
  }),
  [],
  'chemistry visual guides',
);

const entityIds = [...themes, ...topics, ...templates, ...knowledgeItems].map((item) => item.id);
assert.strictEqual(new Set(entityIds).size, entityIds.length, 'chemistry entity IDs must be globally unique');

const topicById = new Map(topics.map((topic) => [topic.id, topic]));
const knowledgeById = new Map(knowledgeItems.map((item) => [item.id, item]));
const templateIds = new Set(templates.map((template) => template.id));

topics.forEach((topic) => {
  assert.strictEqual(topic.knowledgeIds.length, 4, `${topic.id} must contain four knowledge IDs`);
  topic.knowledgeIds.forEach((knowledgeId) => {
    const knowledge = knowledgeById.get(knowledgeId);
    assert(knowledge, `${topic.id} references missing knowledge ${knowledgeId}`);
    assert.strictEqual(knowledge.topicId, topic.id, `${knowledgeId} parent topic`);
  });
});

knowledgeItems.forEach((item) => {
  assert(topicById.has(item.topicId), `${item.id} has unknown topic ${item.topicId}`);
  ['title', 'summary', 'boundary', 'coverImage'].forEach((field) => assertText(item[field], `${item.id}.${field}`));
  assert.strictEqual(item.subjectId, 'chemistry', `${item.id}.subjectId`);
  assert(Array.isArray(item.tags) && item.tags.length >= 2, `${item.id}.tags`);
  assert(Array.isArray(item.keywords) && item.keywords.length >= 3, `${item.id}.keywords`);
  assert(Array.isArray(item.knowledgePoints) && item.knowledgePoints.length >= 3, `${item.id}.knowledgePoints`);
  assert(Array.isArray(item.sections) && item.sections.length >= 3, `${item.id}.sections`);
  item.sections.forEach((section, index) => assertSection(section, `${item.id}.sections[${index}]`));
  assert(item.sections.some((section) => section.type === 'example'), `${item.id} needs an example section`);
  assert(Array.isArray(item.templateIds) && item.templateIds.length >= 1, `${item.id}.templateIds`);
  item.templateIds.forEach((templateId) => assert(templateIds.has(templateId), `${item.id} unknown template ${templateId}`));
  assert(Array.isArray(item.relatedIds) && item.relatedIds.length === 2, `${item.id}.relatedIds`);
  item.relatedIds.forEach((relatedId) => {
    assert(knowledgeById.has(relatedId) && relatedId !== item.id, `${item.id} invalid related ID ${relatedId}`);
  });
  assert(item.contentMeta && item.contentMeta.status === 'verified', `${item.id}.contentMeta`);
});

knowledgeItems.forEach((item) => {
  item.relatedIds.forEach((relatedId) => {
    assert(knowledgeById.get(relatedId).relatedIds.includes(item.id), `${item.id} -> ${relatedId} must be reciprocal`);
  });
});

const experimentGetter = chemistryKnowledge.getChemistryExperiments;
const equationGetter = chemistryKnowledge.getChemistryEquations;
const rawSectionGetter = chemistryKnowledge.getRawChemistrySections;
assert.strictEqual(typeof experimentGetter, 'function', 'getChemistryExperiments export');
assert.strictEqual(typeof equationGetter, 'function', 'getChemistryEquations export');
assert.strictEqual(typeof rawSectionGetter, 'function', 'getRawChemistrySections export');

const rawExperiments = rawSectionGetter('experiment');
const rawEquations = rawSectionGetter('equation');
const experiments = experimentGetter();
const equations = equationGetter();
assertRawSectionUniqueness(rawEquations, rawExperiments);
assert.strictEqual(rawExperiments.length, 8, 'raw chemistry experiment count');
assert(rawEquations.length >= 24, `raw chemistry equation count: ${rawEquations.length}`);
assert.deepStrictEqual(experiments.map((item) => item.experimentId).sort(), [...EXPECTED_EXPERIMENT_IDS].sort());
assert.strictEqual(experiments.length, 8, 'chemistry experiment count');
assert.strictEqual(new Set(experiments.map((item) => item.experimentId)).size, experiments.length, 'experiment IDs');
assert(equations.length >= 24, `chemistry equation count: ${equations.length}`);
assert.strictEqual(new Set(equations.map((item) => item.equationId)).size, equations.length, 'equation IDs');
assert.strictEqual(new Set(equations.map((item) => item.equation)).size, equations.length, 'equation strings');

const experimentClone = experimentGetter();
const equationClone = equationGetter();
assert.notStrictEqual(experiments, experimentClone, 'experiment array must be cloned');
assert.notStrictEqual(experiments[0], experimentClone[0], 'experiment records must be cloned');
assert.notStrictEqual(experiments[0].steps, experimentClone[0].steps, 'experiment nested arrays must be cloned');
assert.notStrictEqual(equations, equationClone, 'equation array must be cloned');
assert.notStrictEqual(equations[0], equationClone[0], 'equation records must be cloned');

const equationFixture = rawEquations[0];
const experimentFixture = rawExperiments[0];
assert.throws(
  () => withInjectedRawSection(
    { ...equationFixture, equation: '2H2 + O2 -> 2H2O' },
    () => assertRawSectionUniqueness(rawSectionGetter('equation'), rawSectionGetter('experiment')),
  ),
  /raw equation IDs must be unique/,
  'duplicate raw equation IDs must be rejected before runtime deduplication',
);
assert.throws(
  () => withInjectedRawSection(
    { ...equationFixture, equationId: 'chem-eq-validator-duplicate-string' },
    () => assertRawSectionUniqueness(rawSectionGetter('equation'), rawSectionGetter('experiment')),
  ),
  /raw equation strings must be unique/,
  'duplicate raw equation strings under different IDs must be rejected before runtime deduplication',
);
assert.throws(
  () => withInjectedRawSection(
    { ...experimentFixture, title: '重复实验夹具' },
    () => assertRawSectionUniqueness(rawSectionGetter('equation'), rawSectionGetter('experiment')),
  ),
  /raw experiment IDs must be unique/,
  'duplicate raw experiment IDs must be rejected before runtime deduplication',
);

rejectForbidden({ themes, topics, templates, knowledgeItems });
assert(!JSON.stringify({ themes, topics, templates, knowledgeItems }).includes('石棉'), 'obsolete asbestos wording');

console.log(
  `OK chemistry content: ${themes.length} themes, ${topics.length} topics, ${knowledgeItems.length} knowledge items, `
    + `${templates.length} templates, ${experiments.length} experiments, ${equations.length} equations`,
);
