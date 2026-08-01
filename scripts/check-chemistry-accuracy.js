const assert = require('assert');
const chemistryKnowledge = require('../packages/chemistry/data/chemistry-knowledge');

const {
  knowledgeItems,
  getChemistryEquations,
  getChemistryExperiments,
  getRawChemistrySections,
} = chemistryKnowledge;

const EXPECTED_EQUATIONS = {
  'chem-eq-hydrogen-peroxide': '2H2O2 -> 2H2O + O2(g)',
  'chem-eq-water-electrolysis': '2H2O -> 2H2(g) + O2(g)',
  'chem-eq-carbon-dioxide-limewater': 'CO2 + Ca(OH)2 -> CaCO3(s) + H2O',
  'chem-eq-zinc-hydrochloric': 'Zn + 2HCl -> ZnCl2 + H2(g)',
  'chem-eq-neutralization': 'HCl + NaOH -> NaCl + H2O',
};
const REQUIRED_EQUATION_IDS = [
  'chem-eq-carbon-monoxide-combustion',
  'chem-eq-carbon-copper-oxide',
  'chem-eq-calcium-carbonate-hydrochloric',
  'chem-eq-carbon-dioxide-limewater',
  'chem-eq-zinc-hydrochloric',
  'chem-eq-iron-copper-sulfate',
  'chem-eq-copper-silver-nitrate',
  'chem-eq-copper-oxide-sulfuric',
  'chem-eq-neutralization',
  'chem-eq-calcium-hydroxide-sodium-carbonate',
  'chem-eq-sodium-hydroxide-copper-sulfate',
  'chem-eq-barium-chloride-sodium-sulfate',
  'chem-eq-silver-nitrate-hydrochloric',
];
const REQUIRED_EXPERIMENT_IDS = [
  'chem-exp-coarse-salt',
  'chem-exp-oxygen',
  'chem-exp-carbon-dioxide',
  'chem-exp-metals',
  'chem-exp-acids-bases',
  'chem-exp-sodium-chloride-solution',
  'chem-exp-water-composition',
  'chem-exp-combustion-conditions',
];
const GLOBAL_SAFETY = [
  ['school laboratory', /学校实验室/],
  ['teacher control', /教师/],
  ['labeled materials', /标签|标明|标识/],
  ['protective eyewear', /护目镜/],
  ['no tasting', /(禁止|不得)[^；。]*品尝/],
  ['no direct smelling', /(禁止|不得)[^；。]*(直接闻|凑近闻|闻气味)/],
  ['no unknown-gas ignition', /(禁止|不得)[^；。]*点燃未知/],
  ['no improvised apparatus', /(禁止|不得)[^；。]*(自制|临时拼装|改装|家用器具|生活容器|食品容器)/],
  ['controlled waste', /(废液|残余物|实验溶液|废弃物|反应废液)[^；。]*(教师|指定|回收|处理)/],
  ['abnormal response', /(异常|溅洒|破裂|泄漏|失火|割伤)[^；。]*(停止|报告|教师|应急)/],
];
const SPECIFIC_SAFETY = {
  'chem-exp-carbon-dioxide': [
    ['ventilation', /通风/],
    ['no inhalation', /(禁止|不得)[^；。]*(吸入|呼吸)/],
    ['no sealed pressure', /(禁止|不得)[^；。]*(密闭增压|密闭容器|加压)/],
    ['controlled limewater', /石灰水[^；。]*(教师|指导|指定|控制)/],
  ],
  'chem-exp-metals': [
    ['sharp and hot metal', /(尖锐|锐边|锋利)[^；。]*(热|高温)|热金属|高温金属/],
    ['no skin contact', /(禁止|不得)[^；。]*(接触皮肤|涂抹皮肤|徒手触摸)/],
    ['metal waste stream', /(金属|含金属)[^；。]*(废液|废弃物)[^；。]*(指定|回收|处理)/],
  ],
  'chem-exp-acids-bases': [
    ['dilute reagents', /(稀盐酸|稀硫酸|稀酸|稀溶液)/],
    ['corrosive protection', /(腐蚀|酸碱)[^；。]*(护目镜|防护|冲洗)/],
    ['teacher spill response', /(溅洒|洒出|泄漏)[^；。]*教师/],
    ['qualitative pH', /定性|不作精密|不用于定量/],
  ],
  'chem-exp-coarse-salt': [
    ['filtration and evaporation', /过滤[^；。]*蒸发|蒸发[^；。]*过滤/],
    ['hot glassware', /(热玻璃|高温器皿|热器皿)/],
    ['no drain disposal', /(禁止|不得)[^；。]*(下水道|生活排水|家庭水槽)/],
    ['no product tasting', /(禁止|不得)[^；。]*品尝/],
  ],
};

function addCounts(target, source, multiplier = 1) {
  Object.entries(source).forEach(([element, count]) => {
    target[element] = (target[element] || 0) + count * multiplier;
  });
}

function readPositiveInteger(text, start, label) {
  let end = start;
  while (/\d/.test(text[end] || '')) end += 1;
  if (end === start) return { value: 1, end };

  const token = text.slice(start, end);
  assert(!token.startsWith('0'), `${label} must be a positive integer without a leading zero`);
  const value = Number(token);
  assert(Number.isSafeInteger(value) && value > 0, `${label} must be a positive safe integer`);
  return { value, end };
}

function parseFormula(formula, start = 0, nested = false) {
  const counts = {};
  let index = start;
  let componentCount = 0;
  while (index < formula.length) {
    if (formula[index] === ')') {
      if (!nested) throw new Error(`unexpected ) in ${formula}`);
      assert(componentCount > 0, `empty group in ${formula}`);
      return { counts, end: index + 1, componentCount };
    }
    if (formula[index] === '(') {
      const group = parseFormula(formula, index + 1, true);
      const multiplier = readPositiveInteger(formula, group.end, `group subscript in ${formula}`);
      addCounts(counts, group.counts, multiplier.value);
      index = multiplier.end;
      componentCount += 1;
      continue;
    }
    const elementMatch = formula.slice(index).match(/^([A-Z][a-z]?)/);
    if (!elementMatch) throw new Error(`invalid formula at ${formula.slice(index)}`);
    const element = elementMatch[1];
    const amount = readPositiveInteger(formula, index + element.length, `element subscript in ${formula}`);
    counts[element] = (counts[element] || 0) + amount.value;
    index = amount.end;
    componentCount += 1;
  }
  if (nested) throw new Error(`unclosed group in ${formula}`);
  assert(componentCount > 0, 'formula must contain at least one element or group');
  return { counts, end: index, componentCount };
}

function parseTerm(term) {
  const normalized = term.trim();
  assert(normalized, 'equation term must not be empty');
  assert(!/\s/.test(normalized), `equation term contains internal whitespace: ${term}`);

  let formulaWithState = normalized;
  let coefficient = 1;
  const coefficientMatch = formulaWithState.match(/^(\d+)/);
  if (coefficientMatch) {
    const token = coefficientMatch[1];
    assert(!token.startsWith('0'), `coefficient must be a positive integer: ${term}`);
    coefficient = Number(token);
    assert(Number.isSafeInteger(coefficient) && coefficient > 0, `coefficient must be a positive safe integer: ${term}`);
    formulaWithState = formulaWithState.slice(token.length);
  }

  const stateMatch = formulaWithState.match(/\((?:g|s|l|aq)\)$/);
  const formula = stateMatch
    ? formulaWithState.slice(0, -stateMatch[0].length)
    : formulaWithState;
  assert(formula, `equation term requires a formula before its state: ${term}`);

  const counts = {};
  addCounts(counts, parseFormula(formula).counts, coefficient);
  return counts;
}

function parseSide(side) {
  const normalized = side.trim();
  assert(normalized, 'equation side must not be empty');
  const terms = normalized.split('+');
  assert(terms.every((term) => term.trim()), 'equation side contains an empty term');
  return terms.reduce((counts, term) => {
    addCounts(counts, parseTerm(term));
    return counts;
  }, {});
}

function assertBalanced(equation) {
  assert.strictEqual(typeof equation, 'string', 'equation must be a string');
  assert(/^[A-Za-z0-9()+\- >]+$/.test(equation), `${equation} must be ASCII`);
  assert(!/[↑↓→=]/.test(equation), `${equation} contains a forbidden arrow or state marker`);
  const arrows = equation.match(/->/g) || [];
  assert.strictEqual(arrows.length, 1, `${equation} must contain exactly one ->`);
  const sides = equation.split('->');
  const left = parseSide(sides[0]);
  const right = parseSide(sides[1]);
  new Set([...Object.keys(left), ...Object.keys(right)]).forEach((element) => {
    assert.strictEqual(left[element] || 0, right[element] || 0, `${equation} is not balanced for ${element}`);
  });
}

assert.deepStrictEqual(parseTerm('2Ca(OH)2'), { Ca: 2, O: 4, H: 4 });
assertBalanced('Cu + 2AgNO3 -> Cu(NO3)2 + 2Ag');
assert.throws(() => assertBalanced('2H2 + O2 -> H2O'), /not balanced/);
[
  ['multiple terminal states', '2H2(g)(s) + O2 -> 2H2O'],
  ['state before formula', '2(g)H2 + O2 -> 2H2O'],
  ['empty group', '2H2() + O2 -> 2H2O'],
  ['zero coefficient', '0H2 + O2 -> H2O'],
  ['zero subscript', '2H0 + O2 -> 2H2O'],
  ['dangling term', '2H2 + O2 + -> 2H2O'],
  ['empty side', ' -> 2H2O'],
  ['empty middle term', '2H2 + + O2 -> 2H2O'],
  ['multiple arrows', '2H2 -> O2 -> 2H2O'],
  ['unsupported character', '2H2 * O2 -> 2H2O'],
].forEach(([label, equation]) => {
  assert.throws(() => assertBalanced(equation), undefined, `${label} must be rejected`);
});

assert.strictEqual(typeof getRawChemistrySections, 'function', 'getRawChemistrySections export');
const equations = getRawChemistrySections('equation');
assert(equations.length >= 24, `expected at least 24 equations, found ${equations.length}`);
assert.strictEqual(
  new Set(equations.map((item) => item.equationId)).size,
  equations.length,
  'raw equation IDs must be unique before runtime deduplication',
);
assert.strictEqual(
  new Set(equations.map((item) => item.equation)).size,
  equations.length,
  'raw equation strings must be unique before runtime deduplication',
);
assert.strictEqual(getChemistryEquations().length, equations.length, 'runtime equation getter must preserve valid raw count');
const equationById = new Map(equations.map((equation) => [equation.equationId, equation]));

Object.entries(EXPECTED_EQUATIONS).forEach(([equationId, expected]) => {
  assert(equationById.has(equationId), `missing anchor ${equationId}`);
  assert.strictEqual(equationById.get(equationId).equation, expected, `${equationId} canonical ASCII equation`);
});
REQUIRED_EQUATION_IDS.forEach((equationId) => assert(equationById.has(equationId), `missing coverage equation ${equationId}`));

equations.forEach((equation) => {
  assertBalanced(equation.equation);
  assert(typeof equation.condition === 'string' && equation.condition.trim(), `${equation.equationId}.condition`);
  assert(typeof equation.interpretation === 'string' && equation.interpretation.trim(), `${equation.equationId}.interpretation`);
  assert.strictEqual(typeof equation.phenomenon, 'string', `${equation.equationId}.phenomenon`);
  assert(
    equation.phenomenon.trim() || equation.interpretation.trim(),
    `${equation.equationId} needs phenomenon or interpretation`,
  );
});

const experiments = getRawChemistrySections('experiment');
assert.strictEqual(
  new Set(experiments.map((item) => item.experimentId)).size,
  experiments.length,
  'raw experiment IDs must be unique before runtime deduplication',
);
assert.strictEqual(getChemistryExperiments().length, experiments.length, 'runtime experiment getter must preserve valid raw count');
assert.deepStrictEqual(experiments.map((item) => item.experimentId).sort(), [...REQUIRED_EXPERIMENT_IDS].sort());
experiments.forEach((experiment) => {
  ['purpose', 'phenomenon', 'conclusion', 'safety'].forEach((field) => {
    assert(typeof experiment[field] === 'string' && experiment[field].trim(), `${experiment.experimentId}.${field}`);
  });
  ['apparatus', 'steps', 'errors'].forEach((field) => {
    assert(Array.isArray(experiment[field]) && experiment[field].length >= 2, `${experiment.experimentId}.${field}`);
  });
  const text = JSON.stringify(experiment);
  GLOBAL_SAFETY.forEach(([dimension, pattern]) => {
    assert(pattern.test(text), `${experiment.experimentId} missing safety dimension: ${dimension}`);
  });
  (SPECIFIC_SAFETY[experiment.experimentId] || []).forEach(([dimension, pattern]) => {
    assert(pattern.test(text), `${experiment.experimentId} missing specific safety rule: ${dimension}`);
  });
});

const knowledgeById = new Map(knowledgeItems.map((item) => [item.id, item]));
const REQUIRED_BOUNDARIES = {
  'chem-k-carbon-oxides': ['不完全燃烧', '毒性', '工业', '还原性'],
  'chem-k-metal-extraction': ['电化学', '工业', '计算'],
  'chem-k-indicators-ph': ['定性', '对数', '滴定'],
  'chem-k-ion-reactions': ['宏观现象', '离子方程式', '定量分析'],
  'chem-k-organic-basics': ['官能团', '同分异构', '命名', '聚合机理'],
  'chem-k-substance-classification': ['化合', '分解', '置换', '复分解'],
  'chem-k-resources-environment': ['需求', '设计', '评价', '改进', '科学伦理', '法律规范', '化学品', '食品', '药品'],
};
Object.entries(REQUIRED_BOUNDARIES).forEach(([knowledgeId, fragments]) => {
  const item = knowledgeById.get(knowledgeId);
  assert(item, `missing boundary owner ${knowledgeId}`);
  const text = JSON.stringify(item);
  fragments.forEach((fragment) => assert(text.includes(fragment), `${knowledgeId} must include ${fragment}`));
});

console.log(`OK chemistry accuracy: ${equations.length} balanced ASCII equations and ${experiments.length} safety-complete experiments`);
