const {
  REFERENCE_INDEX_META,
  REFERENCE_SUBJECT_CODES,
  REFERENCE_KIND_CODES,
  REFERENCE_INDEX_ROWS,
} = require('../data/reference-index');
const { expandSearchTerms, getSearchIndexEntries, normalizeSearchText } = require('./search-index');

const REFERENCE_KINDS = [
  { id: 'formula', title: '公式', count: REFERENCE_INDEX_META.counts.formula, subjectIds: ['math', 'physics'] },
  { id: 'word', title: '单词', count: REFERENCE_INDEX_META.counts.word, subjectIds: ['english'] },
  { id: 'grammar', title: '语法', count: REFERENCE_INDEX_META.counts.grammar, subjectIds: ['english'] },
  { id: 'experiment', title: '实验', count: REFERENCE_INDEX_META.counts.experiment, subjectIds: ['physics'] },
];

const GENERATED_ENTRIES = REFERENCE_INDEX_ROWS.map((row) => {
  const [subjectCode, kindCode, refId, containerId, focusId, title, subtitle, primary, secondary, tags, tokens] = row;
  const subjectId = REFERENCE_SUBJECT_CODES[subjectCode];
  const kind = REFERENCE_KIND_CODES[kindCode];
  return {
    key: `${subjectId}:${kind}:${focusId || refId}`,
    kind,
    subjectId,
    refId,
    containerId,
    focusId,
    title,
    subtitle,
    primary,
    secondary,
    tags,
    tokens,
  };
});

function buildEnglishEntries(kind) {
  return getSearchIndexEntries(kind).map((entry) => ({
    key: entry.key,
    kind,
    subjectId: entry.subjectId,
    refId: entry.refId,
    containerId: entry.containerId,
    focusId: entry.focusId,
    title: entry.title,
    subtitle: entry.subtitle,
    primary: entry.description,
    secondary: (entry.tags || []).join(' · '),
    tags: entry.tags || [],
    tokens: entry.tokens || [],
  }));
}

function getReferenceEntries(kind) {
  if (kind === 'word' || kind === 'grammar') return buildEnglishEntries(kind);
  return GENERATED_ENTRIES.filter((entry) => entry.kind === kind).map((entry) => ({ ...entry }));
}

function hasKeyword(value, normalizedKeyword) {
  if (Array.isArray(value)) return value.some((item) => hasKeyword(item, normalizedKeyword));
  return normalizeSearchText(value).includes(normalizedKeyword);
}

function filterReferenceEntries({ kind = 'formula', subjectId = 'all', keyword = '' } = {}) {
  const normalizedKeyword = normalizeSearchText(keyword);
  const searchTerms = expandSearchTerms(keyword);
  return getReferenceEntries(kind).reduce((results, entry) => {
    if (subjectId !== 'all' && entry.subjectId !== subjectId) return results;
    if (!normalizedKeyword) {
      results.push({ ...entry, matchTerms: [] });
      return results;
    }
    const searchable = [entry.title, entry.primary, entry.secondary, entry.tags, entry.tokens];
    const matchedTerm = searchTerms.find((term) => hasKeyword(searchable, term));
    if (matchedTerm) {
      results.push({
        ...entry,
        matchTerms: searchTerms,
        matchLabel: matchedTerm !== normalizedKeyword ? `关联匹配：${matchedTerm}` : '',
      });
    }
    return results;
  }, []);
}

function getReferenceStats() {
  return REFERENCE_KINDS.map((item) => ({ ...item, subjectIds: [...item.subjectIds] }));
}

module.exports = {
  REFERENCE_INDEX_META,
  REFERENCE_KINDS,
  filterReferenceEntries,
  getReferenceEntries,
  getReferenceStats,
};
