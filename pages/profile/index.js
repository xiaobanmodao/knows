const { RELEASE_INFO } = require('../../utils/release-info');
const { getSubjectRegistry, SUBJECT_LABELS } = require('../../data/subject-manifest');
const { openContent } = require('../../utils/content-routes');
const { REFERENCE_INDEX_META } = require('../../data/reference-index');
const {
  ALL_FILTER_ID,
  NOTE_SUBJECT_IDS,
  buildNoteFacets,
  filterNotes,
  prepareNotes,
} = require('../../utils/note-filter');
const {
  MAX_BACKUP_TEXT_LENGTH,
  createBackup,
  getSnapshotCounts,
  parseBackupText,
  serializeBackup,
} = require('../../utils/local-backup');
const {
  buildBackupFileName,
  chooseBackupFile,
  isUserCancel,
  readBackupFile,
  shareBackupFile,
  writeBackupFile,
} = require('../../utils/local-backup-file');

const subjects = getSubjectRegistry();
const referenceTotal = Object.values(REFERENCE_INDEX_META.counts).reduce((total, count) => total + count, 0);
const NOTE_SUBJECT_FILTERS = [
  { id: ALL_FILTER_ID, title: '全部' },
  ...NOTE_SUBJECT_IDS.map((id) => ({ id, title: SUBJECT_LABELS[id] })),
];

function formatBackupDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';
  const pad = (number) => (number < 10 ? `0${number}` : String(number));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildCountItems(counts) {
  return [
    { id: 'favorites', title: '收藏', count: counts.favorites },
    { id: 'recents', title: '最近浏览', count: counts.recents },
    { id: 'notes', title: '笔记', count: counts.notes },
    { id: 'readingPositions', title: '阅读位置', count: counts.readingPositions },
    { id: 'searchHistory', title: '搜索记录', count: counts.searchHistory },
  ];
}

Page({
  data: {
    mode: '游客模式',
    releaseInfo: RELEASE_INFO,
    hasIcpBeian: Boolean(RELEASE_INFO.icpBeianNumber),
    notes: [],
    noteTotal: 0,
    filteredNoteCount: 0,
    noteCountLabel: '0',
    noteQuery: '',
    noteQueryTerms: [],
    selectedNoteSubjectId: ALL_FILTER_ID,
    selectedNoteTag: ALL_FILTER_ID,
    allNoteFilterId: ALL_FILTER_ID,
    noteSubjectFilters: NOTE_SUBJECT_FILTERS.map((item) => ({ ...item, count: 0 })),
    noteTagFilters: [],
    hasNoteFilters: false,
    noteEmptyTitle: '还没有本地笔记',
    noteEmptyDescription: '在知识点页面记录的笔记会集中显示在这里。',
    localDataCountItems: buildCountItems({ favorites: 0, recents: 0, notes: 0, readingPositions: 0, searchHistory: 0 }),
    pendingBackupPreview: null,
    backupBusy: false,
    referenceItems: [
      { id: 'formula', title: '公式索引', count: REFERENCE_INDEX_META.counts.formula, description: '数学与物理公式、条件和单位' },
      { id: 'word', title: '单词索引', count: REFERENCE_INDEX_META.counts.word, description: '英美音标、词义、搭配和辨析' },
      { id: 'grammar', title: '语法索引', count: REFERENCE_INDEX_META.counts.grammar, description: '结构变式、条件和易混对比' },
      { id: 'experiment', title: '实验索引', count: REFERENCE_INDEX_META.counts.experiment, description: '方法、步骤、结论和误差' },
    ],
    referenceTotal,
    serviceItems: [
      '内容结构：学科大包 / 教材单元或专题 / 知识点与方法',
      '能力范围：搜索、收藏、继续阅读、本地笔记与图示展示',
      '使用方式：无需注册登录，学习记录保存在本机',
    ],
    versionItems: [
      `数学：${subjects[0].chapterCount} 章 · ${subjects[0].topicCount} 专题 · ${subjects[0].templateCount} 模板`,
      `英语：${subjects[1].unitCount} 教材单元 · ${subjects[1].vocabularyCount} 逐词讲解 · ${subjects[1].grammarCount} 语法点`,
      `物理：${subjects[2].chapterCount} 教材章 · ${subjects[2].knowledgeCount} 知识点 · ${subjects[2].exampleCount} 示例`,
      '已支持：三科目录、知识阅读、方法模板、搜索、收藏、继续阅读与本地笔记',
    ],
  },

  onShow() {
    const app = getApp();
    const notes = prepareNotes(app.getNotes()).map((note) => ({
      ...note,
      subjectLabel: SUBJECT_LABELS[note.subjectId || 'math'] || '数学',
    }));
    this.allNotes = notes;
    this.noteFacets = buildNoteFacets(notes);
    this.applyNoteFilters();
    this.setData({
      localDataCountItems: buildCountItems(getSnapshotCounts(app.getLocalDataSnapshot())),
    });
  },

  applyNoteFilters(overrides = {}) {
    const allNotes = this.allNotes || [];
    const facets = this.noteFacets || buildNoteFacets(allNotes);
    const requestedSubjectId = Object.prototype.hasOwnProperty.call(overrides, 'subjectId')
      ? overrides.subjectId
      : this.data.selectedNoteSubjectId;
    const requestedTag = Object.prototype.hasOwnProperty.call(overrides, 'tag')
      ? overrides.tag
      : this.data.selectedNoteTag;
    const noteQuery = Object.prototype.hasOwnProperty.call(overrides, 'keyword')
      ? overrides.keyword
      : this.data.noteQuery;
    const selectedNoteSubjectId = requestedSubjectId === ALL_FILTER_ID || facets.subjectCounts[requestedSubjectId]
      ? requestedSubjectId
      : ALL_FILTER_ID;
    const selectedNoteTag = requestedTag === ALL_FILTER_ID || facets.tags.some((item) => item.id === requestedTag)
      ? requestedTag
      : ALL_FILTER_ID;
    const filteredNotes = filterNotes(allNotes, {
      subjectId: selectedNoteSubjectId,
      tag: selectedNoteTag,
      keyword: noteQuery,
    });
    const notes = filteredNotes.map(({ _order, searchText, ...note }) => note);
    const hasNoteFilters = selectedNoteSubjectId !== ALL_FILTER_ID
      || selectedNoteTag !== ALL_FILTER_ID
      || Boolean(String(noteQuery || '').trim());
    this.setData({
      notes,
      noteTotal: allNotes.length,
      filteredNoteCount: filteredNotes.length,
      noteCountLabel: hasNoteFilters ? `${filteredNotes.length} / ${allNotes.length}` : String(allNotes.length),
      noteQuery,
      noteQueryTerms: noteQuery ? [noteQuery] : [],
      selectedNoteSubjectId,
      selectedNoteTag,
      noteSubjectFilters: NOTE_SUBJECT_FILTERS.map((item) => ({
        ...item,
        count: item.id === ALL_FILTER_ID ? allNotes.length : (facets.subjectCounts[item.id] || 0),
      })),
      noteTagFilters: facets.tags,
      hasNoteFilters,
      noteEmptyTitle: allNotes.length ? '没有匹配的笔记' : '还没有本地笔记',
      noteEmptyDescription: allNotes.length
        ? '调整学科、标签或关键词后再试。'
        : '在知识点页面记录的笔记会集中显示在这里。',
    });
  },

  onNoteQueryChange(event) {
    const noteQuery = event.detail.value || '';
    this.setData({ noteQuery });
    clearTimeout(this.noteQueryTimer);
    this.noteQueryTimer = setTimeout(() => this.applyNoteFilters({ keyword: noteQuery }), 180);
  },

  onNoteQuerySubmit(event) {
    clearTimeout(this.noteQueryTimer);
    this.applyNoteFilters({ keyword: event.detail.value || this.data.noteQuery });
  },

  selectNoteSubject(event) {
    this.applyNoteFilters({ subjectId: event.currentTarget.dataset.id });
  },

  selectNoteTag(event) {
    this.applyNoteFilters({ tag: event.currentTarget.dataset.tag });
  },

  resetNoteFilters() {
    clearTimeout(this.noteQueryTimer);
    this.applyNoteFilters({ subjectId: ALL_FILTER_ID, tag: ALL_FILTER_ID, keyword: '' });
  },

  openNote(event) {
    const { id, subjectId } = event.currentTarget.dataset;
    openContent({ subjectId: subjectId || 'math', type: 'knowledge', id, restore: true });
  },

  openReference(event) {
    wx.navigateTo({ url: `/pages/reference-index/index?kind=${event.currentTarget.dataset.kind}` });
  },

  exportLocalData() {
    if (this.data.backupBusy) return;
    const backup = createBackup(getApp().getLocalDataSnapshot(), {
      appVersion: RELEASE_INFO.versionName,
    });
    const backupText = serializeBackup(backup);
    const fileName = buildBackupFileName(Date.parse(backup.createdAt));
    let loadingVisible = true;
    const hideLoading = () => {
      if (!loadingVisible) return;
      loadingVisible = false;
      wx.hideLoading();
    };
    this.setData({ backupBusy: true });
    wx.showLoading({ title: '正在生成备份', mask: true });

    writeBackupFile(backupText)
      .then((filePath) => {
        hideLoading();
        return shareBackupFile(filePath, fileName);
      })
      .catch((error) => {
        hideLoading();
        if (isUserCancel(error)) return;
        this.offerBackupClipboard(backupText, error);
      })
      .finally(() => {
        hideLoading();
        this.setData({ backupBusy: false });
      });
  },

  offerBackupClipboard(backupText, error) {
    wx.showModal({
      title: '暂时无法发送文件',
      content: `${error && error.message ? error.message : '当前环境不支持文件转发'}。是否将备份文本（可能包含本地笔记）复制到剪贴板？`,
      confirmText: '复制备份',
      success(result) {
        if (!result.confirm) return;
        wx.setClipboardData({
          data: backupText,
          success: () => wx.showToast({ title: '备份已复制', icon: 'success' }),
        });
      },
    });
  },

  chooseLocalBackup() {
    if (this.data.backupBusy) return;
    let loadingVisible = false;
    this.setData({ backupBusy: true });
    chooseBackupFile()
      .then((file) => {
        if (Number(file.size) > MAX_BACKUP_TEXT_LENGTH) throw new Error('备份文件超过 2MB 限制');
        loadingVisible = true;
        wx.showLoading({ title: '正在校验备份', mask: true });
        return readBackupFile(file.path).then((text) => ({ file, backup: parseBackupText(text) }));
      })
      .then(({ file, backup }) => {
        this.pendingBackup = backup;
        this.setData({
          pendingBackupPreview: {
            fileName: file.name || '知识通备份文件',
            createdLabel: formatBackupDate(backup.createdAt),
            appVersion: backup.appVersion,
            countItems: buildCountItems(backup.counts),
          },
        });
      })
      .catch((error) => {
        if (isUserCancel(error)) return;
        wx.showModal({
          title: '无法读取备份',
          content: error.message || '请选择由知识通导出的 JSON 备份文件。',
          showCancel: false,
        });
      })
      .finally(() => {
        if (loadingVisible) wx.hideLoading();
        this.setData({ backupBusy: false });
      });
  },

  cancelBackupRestore() {
    this.pendingBackup = null;
    this.setData({ pendingBackupPreview: null });
  },

  restorePendingBackup(event) {
    if (!this.pendingBackup || this.data.backupBusy) return;
    const mode = event.currentTarget.dataset.mode === 'replace' ? 'replace' : 'merge';
    const replace = mode === 'replace';
    wx.showModal({
      title: replace ? '覆盖本机数据？' : '合并备份数据？',
      content: replace
        ? '当前收藏、笔记、阅读位置和搜索记录将被备份内容替换，此操作无法撤销。'
        : '相同内容将保留更新时间较新的记录，其余备份内容会加入本机。',
      confirmText: replace ? '覆盖恢复' : '确认合并',
      confirmColor: replace ? '#c33232' : '#165dff',
      success: (result) => {
        if (result.confirm) this.applyBackupRestore(mode);
      },
    });
  },

  applyBackupRestore(mode) {
    this.setData({ backupBusy: true });
    wx.showLoading({ title: '正在恢复', mask: true });
    let loadingVisible = true;
    try {
      getApp().restoreLocalData(this.pendingBackup.data, mode);
      this.pendingBackup = null;
      this.setData({ pendingBackupPreview: null });
      this.onShow();
      wx.hideLoading();
      loadingVisible = false;
      wx.showToast({ title: mode === 'replace' ? '已覆盖恢复' : '已合并恢复', icon: 'success' });
    } catch (error) {
      wx.showModal({
        title: '恢复未完成',
        content: '本机存储空间可能不足，原有数据已尽量保留，请清理空间后重试。',
        showCancel: false,
      });
    } finally {
      if (loadingVisible) wx.hideLoading();
      this.setData({ backupBusy: false });
    }
  },

  copyBeianUrl() {
    wx.setClipboardData({
      data: RELEASE_INFO.icpBeianUrl,
      success() {
        wx.showToast({
          title: '备案查询地址已复制',
          icon: 'none',
        });
      },
    });
  },

  onUnload() {
    clearTimeout(this.noteQueryTimer);
    this.pendingBackup = null;
  },
});
