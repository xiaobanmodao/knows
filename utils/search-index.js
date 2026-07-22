const {
  SEARCH_INDEX_META,
  SUBJECT_CODES,
  TYPE_CODES,
  SEARCH_INDEX_ROWS,
} = require('../data/search-index');
const { SUBJECT_LABELS } = require('../data/subject-manifest');
const { normalizeSubjectId } = require('./content-routes');

const TYPE_LABELS = {
  unit: '教材单元',
  word: '单词',
  grammar: '单元语法',
  chapter: '章节',
  topic: '专题',
  knowledge: '知识点',
  template: '方法模板',
};

const SEARCH_ALIASES = {
  '阅读主旨': ['主旨', '篇章结构'],
  '语境猜词': ['猜词', '上下文'],
  '受力分析': ['受力', '平衡'],
  '欧姆定律': ['欧姆', '电阻与电流'],
  spelt: ['spell'],
  spelled: ['spell'],
  color: ['colour'],
  favorite: ['favourite'],
  practice: ['practise'],
  geese: ['goose'],
};

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

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[＝]/g, '=')
    .replace(/[／]/g, '/')
    .replace(/[－—–]/g, '-')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreEntry(entry, keyword) {
  const title = normalizeSearchText(entry.title);
  const tokenMatched = (entry.tokens || []).some((token) => normalizeSearchText(token).includes(keyword));
  const titleScore = title === keyword
    ? 140
    : title.startsWith(keyword)
      ? 105
      : title.includes(keyword)
        ? 80
        : 0;
  return titleScore + (tokenMatched ? 30 : 0);
}

function searchAllSubjects(keyword, subjectId = 'all') {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) {
    return [];
  }

  const selectedSubjectId = subjectId === 'all' ? 'all' : normalizeSubjectId(subjectId);
  const keywords = [normalizedKeyword, ...(SEARCH_ALIASES[normalizedKeyword] || []).map(normalizeSearchText)];
  const resultMap = new Map();

  SEARCH_INDEX
    .filter((entry) => selectedSubjectId === 'all' || entry.subjectId === selectedSubjectId)
    .forEach((entry) => {
      const score = keywords.reduce((best, currentKeyword, index) => {
        const currentScore = scoreEntry(entry, currentKeyword);
        return Math.max(best, index === 0 ? currentScore : Math.floor(currentScore * 0.82));
      }, 0);

      if (score > 0) {
        resultMap.set(entry.key, {
          ...entry,
          id: entry.key,
          subjectLabel: SUBJECT_LABELS[entry.subjectId],
          typeLabel: TYPE_LABELS[entry.type],
          score,
        });
      }
    });

  return [...resultMap.values()]
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'zh-Hans-CN'))
    .map(({ score, tokens, ...entry }) => entry);
}

module.exports = {
  SEARCH_INDEX_META,
  TYPE_LABELS,
  normalizeSearchText,
  searchAllSubjects,
};
