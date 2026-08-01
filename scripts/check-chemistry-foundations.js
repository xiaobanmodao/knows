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
const GLOBAL_EXPERIMENT_SAFETY = [
  ['school laboratory', /学校实验室/],
  ['teacher control', /教师/],
  ['labeled materials', /标签|标明|标识/],
  ['protective eyewear', /护目镜/],
  ['no tasting', /(禁止|不得)[^；。]*品尝/],
  ['no direct smelling', /(禁止|不得)[^；。]*(直接闻|凑近闻|闻气味)/],
  ['no ignition of unknown gas', /(禁止|不得)[^；。]*点燃未知/],
  ['no improvised apparatus', /(禁止|不得)[^；。]*(自制|临时拼装|改装|生活容器|家用器具)/],
  ['controlled waste', /(废液|残余物|实验溶液|废弃物)[^；。]*(教师|指定|回收|处理)/],
  ['abnormal-event response', /(异常|溅洒|破裂|泄漏|失火)[^；。]*(停止|报告|教师|应急)/],
];
const EXPERIMENT_SPECIFIC_SAFETY = {
  'chem-exp-oxygen': [
    ['approved apparatus', /(批准|专用|合规)[^；。]*装置/],
    ['labeled peroxide', /(有标签的过氧化氢|过氧化氢[^；。]*标签)/],
    ['teacher reagent/apparatus control', /教师[^；。]*(加入|添加|加药|检查)/],
    ['apparatus cooling', /冷却/],
    ['oxygen combustion risk', /氧气[^；。]*(支持燃烧|助燃)/],
  ],
  'chem-exp-combustion-conditions': [
    ['ventilation', /通风/],
    ['no fume inhalation', /(燃烧烟气|烟气)[^；。]*(禁止|不得)[^；。]*吸入/],
    ['secured sleeves', /袖口/],
    ['hot residue control', /(热残余物|高温残余物|热器材)[^；。]*(冷却|处理)/],
    ['teacher-controlled extinguishing', /教师[^；。]*灭火|灭火[^；。]*教师/],
  ],
  'chem-exp-water-composition': [
    ['approved low-voltage supply', /学校专用低压/],
    ['no improvised wiring', /(禁止|不得)[^；。]*(自制线路|自制接线|临时接线|改装导线)/],
    ['no mixed-gas storage', /(禁止|不得)[^；。]*(混合|共同储存|储存)[^；。]*(氢气|氧气)|氢气[^；。]*氧气[^；。]*(禁止|不得)[^；。]*(混合|共同储存|储存)/],
    ['observation not gas production', /(不作为|禁止|不得)[^；。]*(独立制气|制氢|燃料|氢能)/],
  ],
  'chem-exp-sodium-chloride-solution': [
    ['contents label', /内容物|氯化钠溶液/],
    ['date label', /配制日期|日期/],
    ['context label', /实验情境|用途|班级/],
    ['no food container', /(禁止|不得)[^；。]*食品容器/],
    ['balance control', /天平/],
    ['glassware control', /玻璃/],
  ],
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
const FORBIDDEN_CONTENT_PATTERNS = [
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
];

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

function rejectForbiddenContent(value, path = 'chemistry') {
  if (typeof value === 'string') {
    FORBIDDEN_CONTENT_PATTERNS.forEach((pattern) => {
      assert(!value.includes(pattern), `${path} contains forbidden learner-facing assessment wording: ${pattern}`);
    });
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.keys(value).forEach((key) => rejectForbiddenContent(value[key], `${path}.${key}`));
}

function collectSections(type) {
  return foundationKnowledge.flatMap((item) => item.sections.filter((section) => section.type === type));
}

function addElementCounts(target, source, multiplier = 1) {
  Object.entries(source).forEach(([element, count]) => {
    target[element] = (target[element] || 0) + count * multiplier;
  });
}

function readFormulaNumber(text, start) {
  let end = start;
  while (/\d/.test(text[end] || '')) end += 1;
  return {
    value: end === start ? 1 : Number(text.slice(start, end)),
    end,
  };
}

function parseFormulaGroup(formula, start = 0, closes = false) {
  const counts = {};
  let index = start;
  while (index < formula.length) {
    if (formula[index] === ')') {
      if (!closes) throw new Error(`unexpected ) in ${formula}`);
      return { counts, end: index + 1 };
    }
    if (formula[index] === '(') {
      const nested = parseFormulaGroup(formula, index + 1, true);
      const multiplier = readFormulaNumber(formula, nested.end);
      addElementCounts(counts, nested.counts, multiplier.value);
      index = multiplier.end;
      continue;
    }
    const match = formula.slice(index).match(/^([A-Z][a-z]?)/);
    if (!match) throw new Error(`invalid formula at ${formula.slice(index)}`);
    const element = match[1];
    const amount = readFormulaNumber(formula, index + element.length);
    counts[element] = (counts[element] || 0) + amount.value;
    index = amount.end;
  }
  if (closes) throw new Error(`unclosed group in ${formula}`);
  return { counts, end: index };
}

function parseEquationTerm(term) {
  const normalized = term.replace(/\((?:aq|s|l|g)\)/gi, '').replace(/\s+/g, '');
  const coefficientMatch = normalized.match(/^(\d+)?(.+)$/);
  assert(coefficientMatch, `invalid equation term: ${term}`);
  const counts = {};
  addElementCounts(
    counts,
    parseFormulaGroup(coefficientMatch[2]).counts,
    Number(coefficientMatch[1] || 1),
  );
  return counts;
}

function parseEquationSide(side) {
  return side.split('+').reduce((counts, term) => {
    addElementCounts(counts, parseEquationTerm(term));
    return counts;
  }, {});
}

function assertEquationBalanced(equation) {
  const sides = equation.split('->');
  assert.strictEqual(sides.length, 2, `${equation} must contain one -> arrow`);
  const left = parseEquationSide(sides[0]);
  const right = parseEquationSide(sides[1]);
  const elements = new Set([...Object.keys(left), ...Object.keys(right)]);
  elements.forEach((element) => {
    assert.strictEqual(left[element] || 0, right[element] || 0, `${equation} is not balanced for ${element}`);
  });
}

assert.strictEqual(themes.length, 5);
assert.strictEqual(topics.length, 10);
assert.strictEqual(templates.length, 12);
assert.strictEqual(foundationKnowledge.length, 20);
assert.strictEqual(knowledgeItems.length, 40);

assert.deepStrictEqual(themes.map((item) => item.id), THEME_IDS);
assert.deepStrictEqual(topics.map((item) => item.id), TOPIC_CONTRACT.map((item) => item.id));
assert.deepStrictEqual(templates.map((item) => item.id), TEMPLATE_IDS);
assert.deepStrictEqual(foundationKnowledge.map((item) => item.id), FOUNDATION_IDS);
assert.deepStrictEqual(knowledgeItems.slice(0, FOUNDATION_IDS.length).map((item) => item.id), FOUNDATION_IDS);

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
assert(
  !JSON.stringify({ themes, topics, templates, foundationKnowledge }).includes('石棉'),
  'chemistry content must use material-neutral approved heat-resistant support wording',
);

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
  const cardText = JSON.stringify(experiment);
  GLOBAL_EXPERIMENT_SAFETY.forEach(([dimension, pattern]) => {
    assert(pattern.test(cardText), `${experiment.experimentId} missing global safety dimension: ${dimension}`);
  });
  EXPERIMENT_SPECIFIC_SAFETY[experiment.experimentId].forEach(([dimension, pattern]) => {
    assert(pattern.test(cardText), `${experiment.experimentId} missing specific safety dimension: ${dimension}`);
  });
});

const equations = collectSections('equation');
assert(equations.length >= 10, `expected at least 10 equations, found ${equations.length}`);
assert.strictEqual(new Set(equations.map((item) => item.equationId)).size, equations.length, 'equation IDs must be unique');
assert.strictEqual(new Set(equations.map((item) => item.equation)).size, equations.length, 'equation strings must be unique');
assertEquationBalanced('Cu + 2AgNO3 -> Cu(NO3)2 + 2Ag');
assert.throws(() => assertEquationBalanced('2H2 + O2 -> H2O'), /not balanced/);
equations.forEach((equation) => {
  assertNonemptyString(equation.equationId, 'equation.equationId');
  assertNonemptyString(equation.equation, `${equation.equationId}.equation`);
  assert(equation.equation.includes('->'), `${equation.equationId}.equation must use searchable ->`);
  assert(
    /^[A-Za-z0-9()+\- >]+$/.test(equation.equation) && !/[↑↓→=]/.test(equation.equation),
    `${equation.equationId}.equation must use ASCII formulas with (g)/(s) state notation`,
  );
  assertEquationBalanced(equation.equation);
  assertNonemptyString(equation.condition, `${equation.equationId}.condition`);
  assert(
    (typeof equation.phenomenon === 'string' && equation.phenomenon.trim())
      || (typeof equation.interpretation === 'string' && equation.interpretation.trim()),
    `${equation.equationId} needs phenomenon or interpretation`,
  );
});
const aluminumEquation = equations.find((equation) => equation.equationId === 'chem-eq-aluminum-oxygen');
assert(aluminumEquation, 'chem-eq-aluminum-oxygen must exist');
assert.match(aluminumEquation.condition, /完全反应.*计算假设/, 'aluminum equation must be a supplied complete-reaction assumption');
assert.strictEqual(aluminumEquation.phenomenon, '', 'aluminum calculation must not claim a combustion phenomenon');
assert.match(
  aluminumEquation.interpretation,
  /不作为.*点燃|不得.*点燃|不构成.*点燃/,
  'aluminum calculation must explicitly reject learner ignition framing',
);

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
assert.throws(() => buildTemplate({ id: 'chem-tpl-test', title: '测试方法', topicIds: [''] }), /topicIds/);
assert.throws(() => buildKnowledge({ id: 'chem-k-test', title: '测试知识' }), /topicId/);
const forcedReview = buildTheme({
  id: 'chem-theme-review-test',
  title: '复核状态测试',
  contentMeta: { status: 'draft', reviewedAt: '1900-01-01' },
});
assert.strictEqual(forcedReview.contentMeta.status, 'verified', 'builders must force verified review metadata');
assert.strictEqual(forcedReview.contentMeta.reviewedAt, '2026-08-01', 'builders must force canonical review date');
const cloneProbeA = buildTheme({ id: 'chem-theme-clone-a', title: '复核克隆甲' });
const cloneProbeB = buildTheme({ id: 'chem-theme-clone-b', title: '复核克隆乙' });
assert.notStrictEqual(cloneProbeA.contentMeta, cloneProbeB.contentMeta, 'metadata objects must be isolated');
assert.notStrictEqual(cloneProbeA.contentMeta.sourceKeys, cloneProbeB.contentMeta.sourceKeys, 'sourceKeys arrays must be isolated');
assert.notStrictEqual(cloneProbeA.contentMeta.sourceRefs, cloneProbeB.contentMeta.sourceRefs, 'sourceRefs arrays must be isolated');
assert.notStrictEqual(
  cloneProbeA.contentMeta.sourceRefs[0],
  cloneProbeB.contentMeta.sourceRefs[0],
  'nested source records must be isolated',
);
const expectedFirstSourceTitle = cloneProbeB.contentMeta.sourceRefs[0].title;
cloneProbeA.contentMeta.status = 'mutated';
cloneProbeA.contentMeta.sourceKeys[0] = 'mutated-source-key';
cloneProbeA.contentMeta.sourceRefs.push({ key: 'mutated-source', title: 'mutated', url: 'https://example.invalid' });
cloneProbeA.contentMeta.sourceRefs[0].title = 'mutated-source-title';
assert.strictEqual(cloneProbeB.contentMeta.status, 'verified', 'top-level metadata mutation must not leak');
assert.deepStrictEqual(cloneProbeB.contentMeta.sourceKeys, SOURCE_KEYS, 'sourceKeys mutation must not leak');
assert.strictEqual(cloneProbeB.contentMeta.sourceRefs.length, 3, 'sourceRefs array mutation must not leak');
assert.strictEqual(
  cloneProbeB.contentMeta.sourceRefs[0].title,
  expectedFirstSourceTitle,
  'nested source-record mutation must not leak',
);

rejectForbiddenFields({ themes, topics, templates, foundationKnowledge });
rejectForbiddenContent({ themes, topics, templates, foundationKnowledge });

console.log(
  `OK chemistry foundations: ${themes.length} themes, ${topics.length} topics, `
    + `${templates.length} templates, ${foundationKnowledge.length} foundation knowledge items, `
    + `${experiments.length} experiments, ${equations.length} equations`,
);
