const { searchAllSubjects } = require('../utils/subjects');

const rankingChecks = [
  ['手拉手模型', 'math', 'template'],
  ['stomachache', 'english', 'word'],
  ['被动语态', 'english', 'knowledge'],
  ['定语从句', 'english', 'knowledge'],
  ['欧姆定律', 'physics', 'chapter'],
  ['浮力', 'physics', 'chapter'],
  ['v＝s／t', 'physics', 'chapter'],
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

['stomachache', 'used to'].forEach((keyword) => {
  const directResult = searchAllSubjects(keyword, 'english')
    .find((item) => ['word', 'grammar'].includes(item.type));

  if (!directResult || !directResult.focusId || !directResult.refId) {
    throw new Error(`英语搜索“${keyword}”缺少单元内直达锚点`);
  }
});

const subjectOnly = searchAllSubjects('函数', 'math');
if (!subjectOnly.length || subjectOnly.some((item) => item.subjectId !== 'math')) {
  throw new Error('学科筛选未将结果限制为数学');
}

console.log(`OK ${rankingChecks.length} search rankings, English anchors and subject filtering checked`);
