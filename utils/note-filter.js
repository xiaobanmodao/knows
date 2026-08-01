const { normalizeSearchText } = require('./search-text');

const NOTE_SUBJECT_IDS = ['math', 'english', 'physics'];
const ALL_FILTER_ID = '__all__';

function formatUpdatedAt(value) {
  const timestamp = Number(value) || 0;
  if (!timestamp) return '本机笔记';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '本机笔记';
  const pad = (number) => (number < 10 ? `0${number}` : String(number));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function prepareNotes(notes = []) {
  return (Array.isArray(notes) ? notes : [])
    .filter((note) => note && note.id)
    .map((note, order) => {
      const subjectId = NOTE_SUBJECT_IDS.includes(note.subjectId) ? note.subjectId : 'math';
      const tags = [...new Set((Array.isArray(note.tags) ? note.tags : [])
        .map((tag) => String(tag || '').trim())
        .filter(Boolean))];
      const prepared = {
        ...note,
        subjectId,
        type: 'knowledge',
        title: String(note.title || '未命名知识点').trim(),
        subtitle: String(note.subtitle || '').trim(),
        content: String(note.content || '').trim(),
        tags,
        updatedAt: Number(note.updatedAt) || 0,
        updatedLabel: formatUpdatedAt(note.updatedAt),
        _order: order,
      };
      prepared.searchText = normalizeSearchText([
        prepared.title,
        prepared.subtitle,
        prepared.content,
        prepared.tags.join(' '),
      ].join(' '));
      return prepared;
    })
    .sort((left, right) => right.updatedAt - left.updatedAt || left._order - right._order);
}

function buildNoteFacets(notes = []) {
  const subjectCounts = notes.reduce((counts, note) => ({
    ...counts,
    [note.subjectId]: (counts[note.subjectId] || 0) + 1,
  }), {});
  const tagCounts = notes.reduce((counts, note) => {
    note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    return counts;
  }, new Map());
  return {
    subjectCounts,
    tags: [...tagCounts.entries()]
      .map(([id, count]) => ({ id, title: id, count }))
      .sort((left, right) => right.count - left.count || left.title.localeCompare(right.title, 'zh-Hans-CN')),
  };
}

function filterNotes(notes = [], {
  subjectId = ALL_FILTER_ID,
  tag = ALL_FILTER_ID,
  keyword = '',
} = {}) {
  const normalizedKeyword = normalizeSearchText(keyword);
  return notes.filter((note) => {
    if (subjectId !== ALL_FILTER_ID && note.subjectId !== subjectId) return false;
    if (tag !== ALL_FILTER_ID && !note.tags.includes(tag)) return false;
    return !normalizedKeyword || note.searchText.includes(normalizedKeyword);
  });
}

module.exports = {
  ALL_FILTER_ID,
  NOTE_SUBJECT_IDS,
  buildNoteFacets,
  filterNotes,
  prepareNotes,
};
