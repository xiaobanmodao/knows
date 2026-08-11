const { SUBJECT_LABELS } = require('../../../data/subject-manifest');
const { TYPE_LABELS } = require('./search-index');

const MAX_RENDERED_RESULTS = 60;

const RESULT_GROUPS = [
  { type: 'unit', title: '教材单元' },
  { type: 'word', title: '单词' },
  { type: 'grammar', title: '单元语法' },
  { type: 'chapter', title: '章节' },
  { type: 'topic', title: '专题' },
  { type: 'knowledge', title: '知识点' },
  { type: 'template', title: '方法模板' },
];

function buildTypeFilters(results) {
  const counts = results.reduce((map, item) => ({
    ...map,
    [item.type]: (map[item.type] || 0) + 1,
  }), {});

  return [
    { id: 'all', title: '全部类型', count: results.length },
    ...RESULT_GROUPS
      .filter((item) => counts[item.type])
      .map((item) => ({ id: item.type, title: TYPE_LABELS[item.type], count: counts[item.type] })),
  ];
}

function buildSearchDisplay(results, selectedType = 'all') {
  const visibleResults = selectedType === 'all'
    ? results
    : results.filter((item) => item.type === selectedType);
  const groupMap = new Map();

  visibleResults.forEach((item) => {
    const key = `${item.subjectId}-${item.type}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        type: item.type,
        title: `${SUBJECT_LABELS[item.subjectId]} · ${TYPE_LABELS[item.type]}`,
        count: 0,
        displayedCount: 0,
        items: [],
      });
    }

    groupMap.get(key).count += 1;
  });

  visibleResults.slice(0, MAX_RENDERED_RESULTS).forEach((item) => {
    const group = groupMap.get(`${item.subjectId}-${item.type}`);
    group.items.push(item);
    group.displayedCount += 1;
  });

  return {
    groupedResults: [...groupMap.values()].filter((group) => group.displayedCount),
    typeFilters: buildTypeFilters(results),
    totalResultCount: visibleResults.length,
    displayedResultCount: Math.min(visibleResults.length, MAX_RENDERED_RESULTS),
  };
}

module.exports = {
  MAX_RENDERED_RESULTS,
  buildSearchDisplay,
};
