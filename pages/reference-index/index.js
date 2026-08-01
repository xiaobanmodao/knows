const { SUBJECT_LABELS } = require('../../data/subject-manifest');
const {
  REFERENCE_KINDS,
  filterReferenceEntries,
} = require('../../utils/reference-index');
const { openContent } = require('../../utils/content-routes');

const PAGE_SIZE = 60;
const VALID_KINDS = new Set(REFERENCE_KINDS.map((item) => item.id));
const REFERENCE_TOTAL = REFERENCE_KINDS.reduce((total, item) => total + item.count, 0);

function buildSubjectFilters(kind) {
  const meta = REFERENCE_KINDS.find((item) => item.id === kind) || REFERENCE_KINDS[0];
  if (meta.subjectIds.length < 2) return [];
  return [
    { id: 'all', title: '全部学科' },
    ...meta.subjectIds.map((id) => ({ id, title: SUBJECT_LABELS[id] })),
  ];
}

function sortEntries(kind, entries) {
  if (kind === 'word') {
    return [...entries].sort((left, right) => left.title.localeCompare(right.title, 'en'));
  }
  if (kind === 'grammar') {
    return [...entries].sort((left, right) => left.title.localeCompare(right.title, 'zh-Hans-CN'));
  }
  return entries;
}

Page({
  data: {
    kinds: REFERENCE_KINDS,
    referenceTotal: REFERENCE_TOTAL,
    selectedKind: 'formula',
    subjectFilters: buildSubjectFilters('formula'),
    selectedSubjectId: 'all',
    query: '',
    entries: [],
    totalCount: 0,
    visibleCount: 0,
    hasMore: false,
  },

  onLoad(options) {
    const selectedKind = VALID_KINDS.has(options.kind) ? options.kind : 'formula';
    this.visibleLimit = PAGE_SIZE;
    this.setData({
      selectedKind,
      subjectFilters: buildSubjectFilters(selectedKind),
      selectedSubjectId: 'all',
    });
    this.refreshEntries();
  },

  selectKind(event) {
    const selectedKind = event.currentTarget.dataset.kind;
    if (!VALID_KINDS.has(selectedKind) || selectedKind === this.data.selectedKind) return;
    this.visibleLimit = PAGE_SIZE;
    this.setData({
      selectedKind,
      selectedSubjectId: 'all',
      subjectFilters: buildSubjectFilters(selectedKind),
      query: '',
    });
    this.refreshEntries();
  },

  selectSubject(event) {
    const selectedSubjectId = event.currentTarget.dataset.id;
    this.visibleLimit = PAGE_SIZE;
    this.setData({ selectedSubjectId });
    this.refreshEntries();
  },

  onQueryChange(event) {
    const query = event.detail.value || '';
    this.setData({ query });
    clearTimeout(this.queryTimer);
    this.queryTimer = setTimeout(() => {
      this.visibleLimit = PAGE_SIZE;
      this.refreshEntries();
    }, 180);
  },

  onQuerySubmit(event) {
    this.visibleLimit = PAGE_SIZE;
    this.setData({ query: event.detail.value || this.data.query });
    this.refreshEntries();
  },

  refreshEntries() {
    const { selectedKind, selectedSubjectId, query } = this.data;
    const results = sortEntries(selectedKind, filterReferenceEntries({
      kind: selectedKind,
      subjectId: selectedSubjectId,
      keyword: query,
    })).map((entry) => ({
      ...entry,
      subjectLabel: SUBJECT_LABELS[entry.subjectId],
      tags: (entry.tags || []).slice(0, 3),
    }));
    this.allEntries = results;
    this.applyVisibleEntries();
  },

  applyVisibleEntries() {
    const allEntries = this.allEntries || [];
    const entries = allEntries.slice(0, this.visibleLimit);
    this.setData({
      entries,
      totalCount: allEntries.length,
      visibleCount: entries.length,
      hasMore: entries.length < allEntries.length,
    });
  },

  loadMore() {
    if (!this.data.hasMore) return;
    this.visibleLimit += PAGE_SIZE;
    this.applyVisibleEntries();
  },

  openEntry(event) {
    const { kind, refId, subjectId, focusId } = event.currentTarget.dataset;
    if (kind === 'word' || kind === 'grammar') {
      openContent({ subjectId: 'english', type: kind, id: refId, focusId });
      return;
    }
    const hasFocus = kind === 'experiment' || kind === 'equation';
    openContent({
      subjectId,
      type: 'knowledge',
      id: refId,
      focusType: hasFocus ? kind : '',
      focusId: hasFocus ? focusId : '',
    });
  },

  onReachBottom() {
    this.loadMore();
  },

  onUnload() {
    clearTimeout(this.queryTimer);
  },
});
