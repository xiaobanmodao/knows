const {
  SEARCH_INDEX_META,
  SUBJECT_CODES,
  TYPE_CODES,
  SEARCH_INDEX_ROWS,
} = require('../data/search-index');
const { SUBJECT_LABELS } = require('../../../data/subject-manifest');
const { SEARCH_ALIAS_GROUPS } = require('../data/search-aliases');
const { normalizeSubjectId } = require('../../../utils/content-routes');
const { normalizeSearchText } = require('../../../utils/search-text');

const TYPE_LABELS = {
  unit: '教材单元',
  word: '单词',
  grammar: '单元语法',
  chapter: '章节',
  topic: '专题',
  knowledge: '知识点',
  template: '方法模板',
};

const TYPE_PRIORITY_BOOST = {
  word: 18,
  grammar: 18,
  knowledge: 24,
  template: 12,
};

const SEARCH_ALIAS_LOOKUP = SEARCH_ALIAS_GROUPS.reduce((lookup, group) => {
  const normalizedTerms = [...new Set(group.terms.map(normalizeSearchText).filter(Boolean))];
  normalizedTerms.forEach((term) => lookup.set(term, normalizedTerms.filter((item) => item !== term)));
  return lookup;
}, new Map());

const SEARCH_INDEX = SEARCH_INDEX_ROWS.map((row) => {
  const [refId, subjectCode, typeCode, containerId, focusId, title, subtitle, description, tags, tokens] = row;
  const subjectId = SUBJECT_CODES[subjectCode];
  const type = TYPE_CODES[typeCode];
  return {
    key: `${subjectId}:${type}:${focusId || refId}`,
    refId,
    subjectId,
    type,
    containerId,
    focusId,
    title,
    subtitle,
    description,
    tags,
    tokens,
  };
});

function expandSearchTerms(value) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return [normalized, ...(SEARCH_ALIAS_LOOKUP.get(normalized) || [])];
}

function scoreEntry(entry, keyword) {
  const title = normalizeSearchText(entry.title);
  const titleScore = title === keyword
    ? 160
    : title.startsWith(keyword)
      ? 120
      : title.includes(keyword)
        ? 95
        : 0;
  const scoreValues = (values, exactScore, includeScore) => (values || []).reduce((best, value) => {
    const normalized = normalizeSearchText(value);
    if (!normalized) return best;
    if (normalized === keyword) return Math.max(best, exactScore);
    if (normalized.includes(keyword)) return Math.max(best, includeScore);
    return best;
  }, 0);
  const fieldScores = [
    { field: 'title', score: titleScore },
    { field: 'tags', score: scoreValues(entry.tags, 72, 58) },
    { field: 'tokens', score: scoreValues(entry.tokens, 66, 46) },
    { field: 'description', score: scoreValues([entry.description], 34, 28) },
    { field: 'subtitle', score: scoreValues([entry.subtitle], 22, 16) },
  ];
  return fieldScores.reduce((best, item) => (item.score > best.score ? item : best), { field: '', score: 0 });
}

function searchAllSubjects(keyword, subjectId = 'all') {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) {
    return [];
  }

  const selectedSubjectId = subjectId === 'all' ? 'all' : normalizeSubjectId(subjectId);
  const keywords = expandSearchTerms(normalizedKeyword);
  const resultMap = new Map();

  SEARCH_INDEX
    .filter((entry) => selectedSubjectId === 'all' || entry.subjectId === selectedSubjectId)
    .forEach((entry) => {
      const match = keywords.reduce((best, currentKeyword, index) => {
        const current = scoreEntry(entry, currentKeyword);
        const weightedScore = index === 0 ? current.score : Math.floor(current.score * 0.65);
        return weightedScore > best.score
          ? { score: weightedScore, term: currentKeyword, field: current.field }
          : best;
      }, { score: 0, term: '', field: '' });

      if (match.score > 0) {
        const matchLabel = match.term && match.term !== normalizedKeyword
          ? `关联匹配：${match.term}`
          : match.field === 'tokens'
            ? `关键词：${match.term}`
            : '';
        resultMap.set(entry.key, {
          ...entry,
          id: entry.key,
          subjectLabel: SUBJECT_LABELS[entry.subjectId],
          typeLabel: TYPE_LABELS[entry.type],
          score: match.score + (TYPE_PRIORITY_BOOST[entry.type] || 0),
          matchedField: match.field,
          matchedTerm: match.term,
          matchTerms: keywords,
          matchLabel,
        });
      }
    });

  return [...resultMap.values()]
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'zh-Hans-CN'))
    .map(({ score, tokens, ...entry }) => entry);
}

function getSearchIndexEntries(types = []) {
  const typeSet = new Set(Array.isArray(types) ? types : [types]);
  return SEARCH_INDEX
    .filter((entry) => !typeSet.size || typeSet.has(entry.type))
    .map((entry) => ({
      ...entry,
      tags: [...(entry.tags || [])],
      tokens: [...(entry.tokens || [])],
    }));
}

module.exports = {
  SEARCH_INDEX_META,
  TYPE_LABELS,
  expandSearchTerms,
  normalizeSearchText,
  getSearchIndexEntries,
  searchAllSubjects,
};
