const { searchAllSubjects } = require('../packages/catalog/utils/search-index');

const rankingChecks = [
  ['手拉手模型', 'math', 'template'],
  ['stomachache', 'english', 'word'],
  ['被动语态', 'english', 'knowledge'],
  ['定语从句', 'english', 'knowledge'],
  ['欧姆定律', 'physics', 'knowledge'],
  ['浮力', 'physics', 'knowledge'],
  ['v＝s／t', 'physics', 'knowledge'],
  ['spelt', 'english', 'word'],
  ['spelled', 'english', 'word'],
  ['color', 'english', 'word'],
  ['geese', 'english', 'word'],
  ['名词性物主代词', 'english', 'grammar'],
  ['There be', 'english', 'grammar'],
  ['practice', 'english', 'word'],
  ['temperatures', 'english', 'word'],
  ['一般过去时', 'english', 'grammar'],
  ['organise', 'english', 'word'],
  ['flavor', 'english', 'word'],
  ['species', 'english', 'word'],
  ['复合不定代词', 'english', 'grammar'],
  ['a piece of advice', 'english', 'word'],
  ['the elderly', 'english', 'word'],
  ['be used to doing', 'english', 'grammar'],
  ['recommend doing', 'english', 'word'],
  ['memorise', 'english', 'word'],
  ['a piece of evidence', 'english', 'word'],
  ['adapt to doing', 'english', 'word'],
  ['in spite of', 'english', 'grammar'],
  ['F浮', 'physics', 'knowledge'],
  ['kg/m³', 'physics', 'knowledge'],
  ['N/kg', 'physics', 'knowledge'],
  ['竖直向上', 'physics', 'knowledge'],
  ['正进负出', 'physics', 'knowledge'],
  ['同一导体', 'physics', 'knowledge'],
  ['全反射', 'physics', 'knowledge'],
  ['勾股定理为什么成立', 'math', 'knowledge'],
  ['数轴方向翻转', 'math', 'knowledge'],
  ['现实可行域', 'math', 'knowledge'],
  ['随机误差', 'math', 'knowledge'],
];

rankingChecks.forEach(([keyword, expectedSubjectId, expectedType]) => {
  const [topResult] = searchAllSubjects(keyword);

  if (!topResult) {
    throw new Error(`搜索“${keyword}”没有结果`);
  }

  if (topResult.subjectId !== expectedSubjectId || topResult.type !== expectedType) {
    throw new Error(
      `搜索“${keyword}”首条应为 ${expectedSubjectId}/${expectedType}，实际为 ${topResult.subjectId}/${topResult.type}`,
    );
  }
});

const practiceResult = searchAllSubjects('practice', 'english')
  .find((item) => item.type === 'word');
if (!practiceResult || practiceResult.title !== 'practise') {
  throw new Error(`practice: 首个单词结果应为 practise，当前为 ${practiceResult ? practiceResult.title : '无结果'}`);
}

['stomachache', 'used to', 'spelt', 'color', 'geese', '名词性物主代词', 'There be', 'practice', 'temperatures', '一般过去时', 'organise', 'flavor', 'species', '复合不定代词', 'a piece of advice', 'the elderly', 'be used to doing', 'recommend doing', 'memorise', 'a piece of evidence', 'adapt to doing', 'in spite of'].forEach((keyword) => {
  const directResult = searchAllSubjects(keyword, 'english')
    .find((item) => ['word', 'grammar'].includes(item.type));

  if (!directResult || !directResult.focusId || !directResult.refId) {
    throw new Error(`英语搜索“${keyword}”缺少单元内直达锚点`);
  }
});

['F浮', 'kg/m³', 'N/kg', '竖直向上', '正进负出', '同一导体', '全反射'].forEach((keyword) => {
  const directResult = searchAllSubjects(keyword, 'physics')
    .find((item) => item.type === 'knowledge');

  if (!directResult || !directResult.refId || !directResult.containerId) {
    throw new Error(`物理搜索“${keyword}”缺少知识点直达信息`);
  }
});

['勾股定理为什么成立', '数轴方向翻转', '现实可行域', '随机误差'].forEach((keyword) => {
  const directResult = searchAllSubjects(keyword, 'math')
    .find((item) => item.type === 'knowledge');

  if (!directResult || !directResult.refId || !directResult.containerId) {
    throw new Error(`数学搜索“${keyword}”缺少知识点直达信息`);
  }
});

const subjectOnly = searchAllSubjects('函数', 'math');
if (!subjectOnly.length || subjectOnly.some((item) => item.subjectId !== 'math')) {
  throw new Error('学科筛选未将结果限制为数学');
}

console.log(`OK ${rankingChecks.length} search rankings, English/physics/math anchors and subject filtering checked`);
