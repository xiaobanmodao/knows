const { SEARCH_ALIAS_GROUPS } = require('../data/search-aliases');
const {
  buildHighlightSegments,
  normalizeSearchText,
} = require('../utils/search-text');
const {
  expandSearchTerms,
  searchAllSubjects,
} = require('../packages/catalog/utils/search-index');

const normalizationChecks = [
  ['v ＝ s ／ t', 'v=s/t'],
  ['a² ＋ b² ＝ c²', 'a^2+b^2=c^2'],
  ['F₁l₁ ＝ F₂l₂', 'f1l1=f2l2'],
  ['P × t', 'p*t'],
  ['ρ ＝ m ∕ V', 'ρ=m/v'],
];

normalizationChecks.forEach(([source, expected]) => {
  const actual = normalizeSearchText(source);
  if (actual !== expected) throw new Error(`“${source}”应规范化为“${expected}”，实际为“${actual}”`);
});

const aliases = new Map();
SEARCH_ALIAS_GROUPS.forEach((group) => {
  group.terms.forEach((term) => {
    const normalized = normalizeSearchText(term);
    if (aliases.has(normalized) && aliases.get(normalized) !== group.id) {
      throw new Error(`别名“${term}”同时属于 ${aliases.get(normalized)} 和 ${group.id}`);
    }
    aliases.set(normalized, group.id);
  });
});

[
  ['spelled', 'spell'],
  ['spell', 'spelt'],
  ['color', 'colour'],
  ['速度公式', 'v=s/t'],
  ['a²+b²=c²', '勾股定理'],
].forEach(([query, expectedAlias]) => {
  const terms = expandSearchTerms(query);
  if (!terms.includes(normalizeSearchText(expectedAlias))) {
    throw new Error(`“${query}”没有展开到别名“${expectedAlias}”`);
  }
});

[
  ['v=s/t', ['v ＝ s ／ t'], 'v=s/t'],
  ['勾股定理为什么成立', ['勾股定理'], '勾股定理'],
  ['The colour is blue.', ['color', 'colour'], 'colour'],
].forEach(([text, terms, expectedMarkedText]) => {
  const segments = buildHighlightSegments(text, terms);
  const markedText = segments.filter((item) => item.highlighted).map((item) => item.text).join('');
  if (markedText !== expectedMarkedText) {
    throw new Error(`“${text}”高亮应为“${expectedMarkedText}”，实际为“${markedText}”`);
  }
});

[
  ['速度公式', 'physics'],
  ['密度公式', 'physics'],
  ['浮力公式', 'physics'],
  ['勾股公式', 'math'],
  ['Ｐ＝ＵＩ', 'physics'],
].forEach(([query, subjectId]) => {
  const [result] = searchAllSubjects(query);
  if (!result || result.subjectId !== subjectId || !result.matchTerms.length || !result.matchLabel) {
    throw new Error(`公式查询“${query}”没有命中 ${subjectId} 内容并返回可见命中依据`);
  }
});

[
  '质量守恒定律',
  '粗盐提纯',
].forEach((query) => {
  const [result] = searchAllSubjects(query);
  if (!result || result.subjectId !== 'chemistry') {
    throw new Error(`化学查询“${query}”没有命中 chemistry 内容`);
  }
});

const aliasResult = searchAllSubjects('spelled', 'english')[0];
if (!aliasResult || aliasResult.title !== 'spell' || !aliasResult.matchLabel) {
  throw new Error('英语词形别名没有保留关联匹配说明');
}

console.log(`OK ${SEARCH_ALIAS_GROUPS.length} alias groups, ${normalizationChecks.length} normalizations, highlight ranges and formula lookups checked`);
