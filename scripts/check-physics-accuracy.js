const physics = require('../packages/physics/data/physics-curriculum');

const issues = [];

function text(value) {
  return JSON.stringify(value || '');
}

function requireTokens(owner, value, tokens) {
  const content = text(value);
  tokens.forEach((token) => {
    if (!content.includes(token)) {
      issues.push(owner + ': 缺少科学条件或安全边界“' + token + '”');
    }
  });
}

function requireOneOf(owner, value, tokens) {
  const content = text(value);
  if (!tokens.some((token) => content.includes(token))) {
    issues.push(owner + ': 至少应包含 ' + tokens.map((token) => '“' + token + '”').join(' 或 '));
  }
}

function forbidToken(owner, value, token) {
  if (text(value).includes(token)) {
    issues.push(owner + ': 仍包含不严谨表述“' + token + '”');
  }
}

function getKnowledge(id) {
  const knowledge = physics.getKnowledgeById(id);
  if (!knowledge) issues.push('缺少待复核知识点 ' + id);
  return knowledge || {};
}

function getChapter(id) {
  const chapter = physics.getChapterById(id);
  if (!chapter) issues.push('缺少待复核章节 ' + id);
  return chapter || {};
}

function getExperiment(id) {
  const knowledge = getKnowledge(id);
  const experiment = (knowledge.sections || []).find((section) => section.type === 'experiment');
  if (!experiment) issues.push(id + ': 缺少实验模块');
  return experiment || {};
}

const lengthMeasurement = getKnowledge('phy-ch01-length-time');
requireTokens('长度测量记录', lengthMeasurement, ['准确数字', '估读数字', '单位']);
forbidToken('长度测量记录', lengthMeasurement, '测量值=准确值+估读值');

requireTokens('空气中声速', getKnowledge('phy-ch02-generation-propagation'), ['340 m/s', '15 ℃']);
requireTokens('响度比较', getKnowledge('phy-ch02-characteristics'), ['距离', '条件相同']);
requireTokens('晶体熔化', getKnowledge('phy-ch03-melting-freezing'), ['一定压强', '熔化过程中', '持续吸热']);
requireTokens('液体沸腾', getKnowledge('phy-ch03-vaporization'), ['外界气压', '沸腾过程中', '沸点']);
requireTokens('反射定律实验', getExperiment('phy-ch04-reflection'), ['同一平面', '分居法线两侧', '反射角等于入射角']);
requireTokens('凸透镜边界', getChapter('phy-ch05-lens').formulas, ['u=2f', 'u=f']);
requireTokens('凸透镜实验安全', getExperiment('phy-ch05-convex-imaging').safety, ['不得', '太阳光']);

requireTokens('弹簧伸长实验', getExperiment('phy-ch07-elastic-force'), ['同一弹簧', '弹性限度']);
requireTokens('牛顿第一定律实验', getExperiment('phy-ch08-newton-inertia'), ['实验观察', '推理', '完全不受力']);
requireTokens('液体压强公式', getKnowledge('phy-ch09-liquid-pressure'), ['静止', '密度均匀', '自由液面', '竖直深度']);
requireTokens('流体压强规律', getKnowledge('phy-ch09-fluid'), ['稳定流动', '适用']);
requireTokens('阿基米德原理', getKnowledge('phy-ch10-archimedes'), ['浸在流体', 'V排', '流体体积']);
requireTokens('浮沉条件', getKnowledge('phy-ch10-floating'), ['只受重力和浮力', '静止漂浮']);
requireTokens('功的公式', getKnowledge('phy-ch11-work'), ['同向', '力方向上的距离']);
requireTokens('功率公式', getKnowledge('phy-ch11-power'), ['同向匀速', 'P=Fv']);
requireTokens('杠杆力臂', getChapter('phy-ch12-simple-machines').formulas, ['垂直距离']);
requireTokens('理想滑轮组', getKnowledge('phy-ch12-pulley'), ['忽略动滑轮重', '绳重', '摩擦']);
requireTokens('机械效率', getKnowledge('phy-ch12-efficiency'), ['0<η<100%']);

requireTokens('比热容公式', getKnowledge('phy-ch13-specific-heat'), ['无相变', 'c 近似不变']);
requireTokens('燃料热值', getKnowledge('phy-ch14-calorific-efficiency'), ['完全燃烧', '实际输入能量']);
requireTokens('元电荷', getKnowledge('phy-ch15-charge'), ['元电荷大小', '电子电荷量为 -e']);
requireTokens('串并联电流实验', getExperiment('phy-ch15-current-rules'), ['串联 I=I₁=I₂', '并联 I=I₁+I₂']);
requireTokens('电阻影响因素实验', getExperiment('phy-ch16-resistance'), ['同温度', '控制变量']);
requireTokens('欧姆定律', getKnowledge('phy-ch17-ohm-calculation'), ['同一导体', '同一状态']);
requireTokens('欧姆定律实验', getExperiment('phy-ch17-current-voltage-resistance'), ['温度近似不变', 'I=U/R']);
requireTokens('焦耳定律', getKnowledge('phy-ch18-joule'), ['Q=I²Rt', '纯电阻']);
requireTokens('家庭电路边界', getKnowledge('phy-ch19-household-circuit'), ['220 V', '低压模型', '不接触', '不拆装']);
requireTokens('安全用电边界', getKnowledge('phy-ch19-safe-use'), ['断电', '专业人员', '不得操作真实 220 V']);
requireTokens('磁感线方向', getChapter('phy-ch20-electric-magnetism').formulas, ['闭合曲线', '外部 N→S', '内部 S→N']);
requireTokens('安培定则', getKnowledge('phy-ch20-current-magnetic'), ['右手', '螺线管中电流', 'N 极']);
requireTokens('电磁波波速', getKnowledge('phy-ch21-electromagnetic-wave'), ['v=λf', '真空中 c=λf']);
requireTokens('光纤通信', getKnowledge('phy-ch21-network'), ['全反射', '纤芯', '包层']);
requireTokens('核能安全边界', getKnowledge('phy-ch22-nuclear'), ['不接触放射源', '不自行开展', '模拟']);

const experiments = physics.knowledgeItems.flatMap((knowledge) => (
  (knowledge.sections || [])
    .filter((section) => section.type === 'experiment')
    .map((experiment) => ({ knowledge, experiment }))
));

if (experiments.length !== 29) {
  issues.push('实验数量应为 29，当前为 ' + experiments.length);
}

experiments.forEach(({ knowledge, experiment }) => {
  const owner = knowledge.id + '/' + (experiment.title || '未命名实验');
  ['goal', 'phenomenon', 'conclusion', 'safety'].forEach((field) => {
    if (!String(experiment[field] || '').trim()) issues.push(owner + ': 缺少 ' + field);
  });
  if (!Array.isArray(experiment.apparatus) || experiment.apparatus.length < 2) {
    issues.push(owner + ': 器材至少 2 项');
  }
  if (!Array.isArray(experiment.steps) || experiment.steps.length < 3) {
    issues.push(owner + ': 步骤至少 3 项');
  }
  if (!Array.isArray(experiment.errors) || experiment.errors.length < 2) {
    issues.push(owner + ': 误差来源至少 2 项');
  }
  if (String(experiment.safety || '').trim().length < 8) {
    issues.push(owner + ': 安全说明过短');
  }
});

[
  'phy-ch15-current-rules',
  'phy-ch16-voltage-rules',
  'phy-ch16-resistance',
  'phy-ch17-current-voltage-resistance',
  'phy-ch17-resistance-measurement',
  'phy-ch18-measure-power',
  'phy-ch20-current-magnetic',
  'phy-ch20-electromagnet-relay',
].forEach((id) => {
  requireTokens(id + ' 电学实验安全', getExperiment(id).safety, ['低压']);
});

[
  'phy-ch03-melting-freezing',
  'phy-ch03-vaporization',
  'phy-ch13-specific-heat',
].forEach((id) => {
  requireOneOf(id + ' 加热实验安全', getExperiment(id).safety, ['护目镜', '防烫']);
});

if (issues.length) {
  console.log('FOUND_PHYSICS_ACCURACY_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log('OK 22 chapters science boundaries and ' + experiments.length + ' experiment safety records checked');
