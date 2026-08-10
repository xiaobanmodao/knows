const physics = require('../packages/physics/data/physics-curriculum');
const {
  DIRECTION_RULES,
  KNOWLEDGE_QUANTITIES,
  QUANTITY_LIBRARY,
} = require('../packages/physics/data/details/physics-depth-knowledge');
const { EXPERIMENT_DEPTH } = require('../packages/physics/data/details/physics-depth-experiments');
const { collectPhysicsFormulaContractIssues } = require('./physics-formula-contract');

const issues = [];
const quantityKeys = new Set(Object.keys(QUANTITY_LIBRARY));
const knowledgeIds = new Set(physics.knowledgeItems.map((item) => item.id));

function issue(owner, message) {
  issues.push(`${owner}: ${message}`);
}

collectPhysicsFormulaContractIssues(physics.knowledgeItems)
  .forEach((message) => issue('公式契约', message));

function requireText(owner, value, field) {
  if (!String(value || '').trim()) issue(owner, `缺少 ${field}`);
}

if (Object.keys(KNOWLEDGE_QUANTITIES).length !== 84) {
  issue('知识点详情映射', `应为 84，当前 ${Object.keys(KNOWLEDGE_QUANTITIES).length}`);
}

physics.knowledgeItems.forEach((knowledge) => {
  const owner = `${knowledge.id}/${knowledge.title}`;
  const detail = knowledge.physicsDetail;
  const formula = (knowledge.sections || []).find((section) => section.type === 'formula');

  if (!detail || detail.detailVersion !== 2) issue(owner, '缺少 detailVersion=2 的物理详情');
  if (!detail || !Array.isArray(detail.conditions) || detail.conditions.length < 1) issue(owner, '至少需要 1 条适用条件');
  if (!detail || !detail.review || detail.review.status !== 'verified') issue(owner, '详情复核状态无效');
  if (!detail || !Array.isArray(detail.review.sourceKeys) || detail.review.sourceKeys.length < 2) issue(owner, '详情复核来源不足');
  if (!formula) issue(owner, '缺少公式与规律区块');

  const expectedQuantityKeys = KNOWLEDGE_QUANTITIES[knowledge.id];
  if (!expectedQuantityKeys) {
    issue(owner, '缺少明确的物理量映射');
  } else {
    expectedQuantityKeys.forEach((key) => {
      if (!quantityKeys.has(key)) issue(owner, `引用未知物理量 ${key}`);
    });
    const actualKeys = (detail.quantities || []).map((item) => item.key);
    if (JSON.stringify(actualKeys) !== JSON.stringify(expectedQuantityKeys)) issue(owner, '物理量合并结果与映射不一致');
  }

  (detail.quantities || []).forEach((quantity) => {
    ['name', 'symbol', 'unit', 'unitName'].forEach((field) => requireText(owner, quantity[field], `物理量 ${quantity.key}.${field}`));
  });

  if (formula) {
    if (!Array.isArray(formula.formulaDetails) || formula.formulaDetails.length !== 1) issue(owner, '公式详情应有 1 项');
    if (!Array.isArray(formula.conditions) || formula.conditions.length < 1) issue(owner, '公式区缺少适用条件');
    requireText(owner, formula.unitNote, '单位说明');
  }
});

Object.keys(KNOWLEDGE_QUANTITIES).forEach((id) => {
  if (!knowledgeIds.has(id)) issue('知识点详情映射', `存在失效 ID ${id}`);
});

Object.keys(DIRECTION_RULES).forEach((id) => {
  const knowledge = physics.getKnowledgeById(id);
  if (!knowledge) {
    issue('方向规则', `存在失效 ID ${id}`);
    return;
  }
  const formula = knowledge.sections.find((section) => section.type === 'formula');
  if (!formula || !Array.isArray(formula.directionRules) || formula.directionRules.length < 1) {
    issue(id, '方向规则未进入公式区');
  }
});

const experiments = physics.knowledgeItems.flatMap((knowledge) => (
  knowledge.sections
    .filter((section) => section.type === 'experiment')
    .map((experiment) => ({ knowledge, experiment }))
));
const experimentIds = new Set();

if (Object.keys(EXPERIMENT_DEPTH).length !== 29 || experiments.length !== 29) {
  issue('实验详情映射', `应为 29/29，当前 ${Object.keys(EXPERIMENT_DEPTH).length}/${experiments.length}`);
}

experiments.forEach(({ knowledge, experiment }) => {
  const owner = `${knowledge.id}/${experiment.title}`;
  if (experiment.structureVersion !== 2) issue(owner, '缺少 structureVersion=2');
  requireText(owner, experiment.experimentId, '稳定实验 ID');
  requireText(owner, experiment.method, '实验方法');
  if (experimentIds.has(experiment.experimentId)) issue(owner, `实验 ID 重复 ${experiment.experimentId}`);
  experimentIds.add(experiment.experimentId);

  ['goal', 'phenomenon', 'conclusion', 'safety'].forEach((field) => requireText(owner, experiment[field], field));
  [['apparatus', 2], ['steps', 3], ['controls', 2], ['records', 2], ['errors', 2]].forEach(([field, count]) => {
    if (!Array.isArray(experiment[field]) || experiment[field].length < count) issue(owner, `${field} 至少 ${count} 项`);
  });
  if (!experiment.review || experiment.review.status !== 'verified') issue(owner, '实验详情复核状态无效');
});

const factChecks = [
  ['平均速度使用总路程总时间', 'phy-ch01-average-speed', '总路程'],
  ['声速注明温度条件', 'phy-ch02-generation-propagation', '15 ℃'],
  ['沸点注明气压条件', 'phy-ch03-vaporization', '外界气压'],
  ['反射角相对法线', 'phy-ch04-reflection', '法线'],
  ['密度说明同种状态温度', 'phy-ch06-density', '温度'],
  ['重力方向竖直向下', 'phy-ch07-gravity', '竖直向下'],
  ['牛顿第一定律区分理想推理', 'phy-ch08-newton-inertia', '理想推理'],
  ['液体深度为竖直深度', 'phy-ch09-liquid-pressure', '竖直深度'],
  ['浮力方向竖直向上', 'phy-ch10-buoyancy-basics', '竖直向上'],
  ['功使用力方向距离', 'phy-ch11-work', '力方向'],
  ['滑轮组说明理想条件', 'phy-ch12-pulley', '忽略动滑轮重'],
  ['比热容说明无相变', 'phy-ch13-specific-heat', '无相变'],
  ['电流方向与电子方向相反', 'phy-ch15-current', '电子'],
  ['电阻比较控制温度', 'phy-ch16-resistance', '温度'],
  ['欧姆定律同一导体同一状态', 'phy-ch17-ohm-calculation', '同一导体'],
  ['纯电阻功率公式边界', 'phy-ch18-power', '纯电阻'],
  ['家庭电路禁止真实操作', 'phy-ch19-household-circuit', '不得接触'],
  ['磁感线外部 N 到 S', 'phy-ch20-magnetism', 'N 极指向 S 极'],
  ['电磁波区分介质和真空', 'phy-ch21-electromagnetic-wave', '真空'],
];

factChecks.forEach(([label, id, token]) => {
  const knowledge = physics.getKnowledgeById(id);
  const text = JSON.stringify(knowledge && knowledge.physicsDetail || {});
  if (!text.includes(token)) issue(label, `缺少“${token}”`);
});

if (issues.length) {
  console.log('FOUND_PHYSICS_DEPTH_ISSUES');
  issues.forEach((item) => console.log(item));
  process.exit(1);
}

const quantityLinkCount = physics.knowledgeItems.reduce((sum, item) => sum + item.physicsDetail.quantities.length, 0);
console.log(`OK ${physics.knowledgeCount} physics details, ${quantityLinkCount} quantity links, ${Object.keys(DIRECTION_RULES).length} direction rules and ${experiments.length} structured experiments checked`);
