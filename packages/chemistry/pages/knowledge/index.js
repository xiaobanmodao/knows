const {
  getKnowledgeById,
  getKnowledgeContext,
  getKnowledgeNavigation,
  getRelatedKnowledge,
} = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openChemistryContent } = require('../../content-routes');
const {
  DEFAULT_READING_PREFERENCES,
  buildReadingDisplayClass,
} = require('../../../../utils/reading-preferences');

function splitKnowledgeSections(sections) {
  const essentialSections = [];
  const detailSections = [];

  (sections || []).forEach((section) => {
    if (section.type === 'text' || section.type === 'example') {
      essentialSections.push(section);
    } else {
      detailSections.push(section);
    }
  });

  return { essentialSections, detailSections };
}

Page({
  data: {
    knowledge: null,
    context: null,
    notFound: '',
    isFavorite: false,
    relatedItems: [],
    navigation: null,
    essentialSections: [],
    detailSections: [],
    detailsExpanded: true,
    coverImageLoadFailed: false,
    noteDraft: '',
    noteTags: [],
    noteTagDraft: '',
    noteDirty: false,
    readingPreferences: { ...DEFAULT_READING_PREFERENCES },
    readingDisplayClass: buildReadingDisplayClass(DEFAULT_READING_PREFERENCES),
    readingSettingsVisible: false,
  },

  onLoad(options) {
    this.pageActive = true;
    const hasSupportedFocus = options.focusType === 'equation' || options.focusType === 'experiment';
    this.pendingFocus = hasSupportedFocus && options.focusId
      ? { type: options.focusType, id: options.focusId }
      : null;
    this.shouldRestorePosition = options.restore === '1' && !this.pendingFocus;
    this.currentScrollTop = 0;
    this.syncReadingPreferences();
    this.loadKnowledge(options.id);
  },

  onShow() {
    this.syncReadingPreferences();
    const { knowledge } = this.data;
    if (!knowledge) return;

    const app = getApp();
    app.refreshSession();
    this.setData({
      isFavorite: app.globalData.favorites.some((item) => (
        item.id === knowledge.id
        && (item.subjectId || 'math') === 'chemistry'
        && (item.type || 'knowledge') === 'knowledge'
      )),
    });
  },

  syncReadingPreferences() {
    const preferences = getApp().getReadingPreferences();
    const readingDisplayClass = buildReadingDisplayClass(preferences);
    this.setData({ readingPreferences: preferences, readingDisplayClass });
  },

  openReadingSettings() {
    this.setData({ readingSettingsVisible: true });
  },

  closeReadingSettings() {
    this.setData({ readingSettingsVisible: false });
  },

  changeReadingPreferences(event) {
    const result = getApp().setReadingPreferences(event.detail.preferences);
    this.setData({
      readingPreferences: result.preferences,
      readingDisplayClass: buildReadingDisplayClass(result.preferences),
    });
    if (!result.saved) wx.showToast({ title: '设置未保存', icon: 'none' });
  },

  resetReadingPreferences() {
    const result = getApp().resetReadingPreferences();
    this.setData({
      readingPreferences: result.preferences,
      readingDisplayClass: buildReadingDisplayClass(result.preferences),
    });
    if (!result.saved) wx.showToast({ title: '设置未保存', icon: 'none' });
  },

  async loadKnowledge(knowledgeId) {
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    this.currentKnowledgeId = knowledgeId;
    const knowledge = getKnowledgeById(knowledgeId);

    if (!knowledge) {
      this.readingItem = null;
      this.setData({
        knowledge: null,
        context: null,
        notFound: '没有找到这个化学知识点，请返回专题目录重新选择。',
      });
      return;
    }

    const context = getKnowledgeContext(knowledge);
    const navigation = getKnowledgeNavigation(knowledge.id);
    const relatedItems = getRelatedKnowledge(knowledge, 4);
    const sectionGroups = splitKnowledgeSections(knowledge.sections);
    const app = getApp();
    const readingPosition = app.getReadingPosition('chemistry', knowledge.id);
    const restorePosition = this.shouldRestorePosition ? readingPosition : null;
    const viewState = restorePosition && restorePosition.viewState ? restorePosition.viewState : {};
    const note = app.getKnowledgeNote('chemistry', knowledge.id);
    const directFocus = Boolean(this.pendingFocus);

    app.refreshSession();
    app.addRecent({
      id: knowledge.id,
      title: knowledge.title,
      subtitle: context ? `化学 · ${context.title}` : '化学知识点',
      subjectId: 'chemistry',
      type: 'knowledge',
      containerId: knowledge.topicId,
    });

    wx.setNavigationBarTitle({ title: knowledge.title });
    this.readingItem = {
      id: knowledge.id,
      title: knowledge.title,
      subtitle: context ? `化学 · ${context.title}` : '化学知识点',
      subjectId: 'chemistry',
      containerId: knowledge.topicId,
    };
    this.currentScrollTop = restorePosition ? restorePosition.scrollTop : 0;

    this.setData({
      knowledge: {
        ...knowledge,
        coverImage: isCloudFile(knowledge.coverImage) ? '' : knowledge.coverImage,
        hasCoverImage: Boolean(knowledge.coverImage),
      },
      context,
      notFound: '',
      relatedItems,
      navigation,
      essentialSections: sectionGroups.essentialSections,
      detailSections: sectionGroups.detailSections,
      detailsExpanded: directFocus ? true : viewState.detailsExpanded !== false,
      coverImageLoadFailed: false,
      noteDraft: note ? note.content : '',
      noteTags: note ? note.tags : [],
      noteTagDraft: '',
      noteDirty: false,
      isFavorite: app.globalData.favorites.some((item) => (
        item.id === knowledge.id
        && (item.subjectId || 'math') === 'chemistry'
        && (item.type || 'knowledge') === 'knowledge'
      )),
    }, () => {
      this.scrollToPendingFocus();
    });
    this.persistReadingPosition();

    const fileMap = await getTempFileURLMap([knowledge.coverImage]);
    if (!this.pageActive || this.assetRequestToken !== requestToken || this.currentKnowledgeId !== knowledgeId) return;
    this.setData({
      'knowledge.coverImage': applyTempFileURL(knowledge.coverImage, fileMap) || (isCloudFile(knowledge.coverImage) ? '' : knowledge.coverImage),
      coverImageLoadFailed: false,
    }, () => {
      this.restoreReadingPosition();
    });
  },

  scrollToPendingFocus() {
    if (!this.pendingFocus) return;
    const focus = this.pendingFocus;
    this.pendingFocus = null;
    this.setData({ detailsExpanded: true }, () => {
      setTimeout(() => {
        wx.pageScrollTo({ selector: `#${focus.type}-${focus.id}`, duration: 240 });
      }, 120);
    });
  },

  restoreReadingPosition() {
    if (!this.shouldRestorePosition || this.currentScrollTop < 40) {
      this.shouldRestorePosition = false;
      return;
    }

    const scrollTop = this.currentScrollTop;
    this.shouldRestorePosition = false;
    setTimeout(() => wx.pageScrollTo({ scrollTop, duration: 0 }), 120);
  },

  persistReadingPosition() {
    if (!this.readingItem) return;
    getApp().saveReadingPosition(this.readingItem, this.currentScrollTop, {
      detailsExpanded: this.data.detailsExpanded,
    });
  },

  toggleFavorite() {
    const { knowledge, context } = this.data;
    if (!knowledge) return;
    const isFavorite = getApp().toggleFavorite({
      id: knowledge.id,
      title: knowledge.title,
      subtitle: context ? `化学 · ${context.title}` : '化学知识点',
      subjectId: 'chemistry',
      type: 'knowledge',
      containerId: knowledge.topicId,
    });
    this.setData({ isFavorite });
    wx.showToast({ title: isFavorite ? '已加入收藏' : '已取消收藏', icon: 'none' });
  },

  openContext() {
    if (!this.data.context) return;
    openChemistryContent({ type: 'topic', id: this.data.context.id });
  },

  openRelated(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;
    this.persistReadingPosition();
    openChemistryContent({ type: 'knowledge', id });
  },

  openAdjacent(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;
    this.persistReadingPosition();
    openChemistryContent({ type: 'knowledge', id }, { replace: true });
  },

  openTemplate(event) {
    openChemistryContent({ type: 'template', id: event.currentTarget.dataset.id });
  },

  toggleDetails() {
    this.setData({ detailsExpanded: !this.data.detailsExpanded });
  },

  copyCoreContent() {
    const { knowledge } = this.data;
    if (!knowledge) return;
    wx.setClipboardData({
      data: [
        knowledge.title,
        knowledge.summary,
        ...(knowledge.knowledgePoints || []).map((item, index) => `${index + 1}. ${item}`),
        knowledge.boundary ? `适用边界：${knowledge.boundary}` : '',
      ].filter(Boolean).join('\n'),
      success() {
        wx.showToast({ title: '核心知识已复制', icon: 'none' });
      },
    });
  },

  onNoteInput(event) {
    this.setData({ noteDraft: event.detail.value || '', noteDirty: true });
  },

  onNoteTagInput(event) {
    this.setData({ noteTagDraft: event.detail.value || '' });
  },

  addNoteTag() {
    const tag = String(this.data.noteTagDraft || '').trim().slice(0, 12);
    if (!tag) return;
    if (this.data.noteTags.includes(tag)) {
      this.setData({ noteTagDraft: '' });
      return;
    }
    if (this.data.noteTags.length >= 5) {
      wx.showToast({ title: '最多添加 5 个标签', icon: 'none' });
      return;
    }
    this.setData({
      noteTags: [...this.data.noteTags, tag],
      noteTagDraft: '',
      noteDirty: true,
    });
  },

  removeNoteTag(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      noteTags: this.data.noteTags.filter((item, itemIndex) => itemIndex !== index),
      noteDirty: true,
    });
  },

  saveNote() {
    const { knowledge, context } = this.data;
    if (!knowledge) return;
    const note = getApp().saveKnowledgeNote({
      id: knowledge.id,
      title: knowledge.title,
      subtitle: context ? `化学 · ${context.title}` : '化学知识点',
      subjectId: 'chemistry',
      containerId: knowledge.topicId,
      content: this.data.noteDraft,
      tags: this.data.noteTags,
    });
    this.setData({
      noteDraft: note ? note.content : '',
      noteTags: note ? note.tags : [],
      noteDirty: false,
    });
    wx.showToast({ title: note ? '笔记已保存' : '笔记已清空', icon: 'none' });
  },

  reopen() {
    this.loadKnowledge(this.currentKnowledgeId || '');
  },

  onPageScroll(event) {
    this.currentScrollTop = event.scrollTop || 0;
  },

  onHide() {
    this.persistReadingPosition();
  },

  onUnload() {
    this.pageActive = false;
    this.assetRequestToken = (this.assetRequestToken || 0) + 1;
    this.persistReadingPosition();
  },

  onCoverImageError(event) {
    console.warn('化学知识图加载失败', event.detail);
    this.setData({ coverImageLoadFailed: true });
  },
});
