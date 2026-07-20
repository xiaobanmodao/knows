const {
  getKnowledgeById,
  getKnowledgeContext,
  getKnowledgeNavigation,
  getRelatedKnowledge,
  normalizeSubjectId,
  SUBJECT_LABELS,
} = require('../../utils/subjects');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

function splitKnowledgeSections(sections) {
  const essential = [];
  const detail = [];

  (sections || []).forEach((section) => {
    if (section.type === 'tip') {
      return;
    }

    if (['formula', 'example', 'experiment'].includes(section.type)) {
      essential.push(section);
    } else {
      detail.push(section);
    }
  });

  if (!essential.length && detail.length) {
    essential.push(detail.shift());
  }

  return { essential, detail };
}

Page({
  data: {
    knowledge: null,
    context: null,
    subjectLabel: '',
    isFavorite: false,
    relatedItems: [],
    coverImageLoadFailed: false,
    navigation: null,
    essentialSections: [],
    detailSections: [],
    detailsExpanded: false,
    templateExpanded: false,
    noteDraft: '',
    noteTags: [],
    noteTagDraft: '',
    noteDirty: false,
  },

  onLoad(options) {
    this.subjectId = normalizeSubjectId(options.subjectId);
    this.shouldRestorePosition = options.restore === '1';
    this.currentScrollTop = 0;
    this.loadKnowledge(options.id);
  },

  onShow() {
    const { knowledge } = this.data;

    if (knowledge) {
      const app = getApp();
      app.refreshSession();
      this.setData({
        isFavorite: app.globalData.favorites.some((item) => item.id === knowledge.id && (item.subjectId || 'math') === this.subjectId && (item.type || 'knowledge') === 'knowledge'),
      });
    }
  },

  async loadKnowledge(knowledgeId) {
    this.currentKnowledgeId = knowledgeId;

    const knowledge = getKnowledgeById(this.subjectId, knowledgeId);

    if (!knowledge) {
      wx.showToast({
        title: '知识点不存在',
        icon: 'none',
      });
      return;
    }

    const context = getKnowledgeContext(this.subjectId, knowledge);
    const navigation = getKnowledgeNavigation(this.subjectId, knowledge.id);
    const relatedItems = getRelatedKnowledge(this.subjectId, knowledge, 4);
    const sectionGroups = splitKnowledgeSections(knowledge.sections);
    const app = getApp();
    const readingPosition = app.getReadingPosition(this.subjectId, knowledge.id);
    const restorePosition = this.shouldRestorePosition ? readingPosition : null;
    const viewState = restorePosition && restorePosition.viewState ? restorePosition.viewState : {};
    const expandedProblems = new Set(viewState.expandedProblems || []);
    const note = app.getKnowledgeNote(this.subjectId, knowledge.id);

    app.refreshSession();
    app.addRecent({
      id: knowledge.id,
      title: knowledge.title,
      subtitle: context ? `${SUBJECT_LABELS[this.subjectId]} · ${context.title}` : `${SUBJECT_LABELS[this.subjectId]}知识点`,
      subjectId: this.subjectId,
      type: 'knowledge',
      containerId: knowledge.containerId || knowledge.chapterId || knowledge.topicId || '',
    });

    wx.setNavigationBarTitle({
      title: knowledge.title,
    });

    const displayKnowledge = {
      ...knowledge,
      coverImage: isCloudFile(knowledge.coverImage) ? '' : knowledge.coverImage,
      problems: (knowledge.problems || []).map((problem, index) => ({
        ...problem,
        image: isCloudFile(problem.image) ? '' : problem.image,
        imageLoadFailed: false,
        expanded: expandedProblems.has(problem.id || String(index)),
      })),
    };

    this.readingItem = {
      id: knowledge.id,
      title: knowledge.title,
      subtitle: context ? `${SUBJECT_LABELS[this.subjectId]} · ${context.title}` : `${SUBJECT_LABELS[this.subjectId]}知识点`,
      subjectId: this.subjectId,
      containerId: knowledge.containerId || knowledge.chapterId || knowledge.topicId || '',
    };
    this.currentScrollTop = restorePosition ? restorePosition.scrollTop : 0;

    this.setData({
      knowledge: displayKnowledge,
      context,
      subjectLabel: SUBJECT_LABELS[this.subjectId],
      relatedItems,
      coverImageLoadFailed: false,
      navigation,
      essentialSections: sectionGroups.essential,
      detailSections: sectionGroups.detail,
      detailsExpanded: Boolean(viewState.detailsExpanded),
      templateExpanded: Boolean(viewState.templateExpanded),
      noteDraft: note ? note.content : '',
      noteTags: note ? note.tags : [],
      noteTagDraft: '',
      noteDirty: false,
      isFavorite: app.globalData.favorites.some((item) => item.id === knowledge.id && (item.subjectId || 'math') === this.subjectId && (item.type || 'knowledge') === 'knowledge'),
    });
    this.persistReadingPosition();

    const imagePaths = [
      knowledge.coverImage,
      ...(knowledge.problems || []).map((problem) => problem.image),
    ];
    const fileMap = await getTempFileURLMap(imagePaths);

    if (this.currentKnowledgeId !== knowledgeId) {
      return;
    }

    const signedCoverImage = applyTempFileURL(knowledge.coverImage, fileMap);
    const signedProblems = (knowledge.problems || []).map((problem, index) => ({
      ...problem,
      image: applyTempFileURL(problem.image, fileMap) || (isCloudFile(problem.image) ? '' : problem.image),
      imageLoadFailed: false,
      expanded: displayKnowledge.problems[index].expanded,
    }));

    this.setData({
      coverImageLoadFailed: false,
      'knowledge.coverImage': signedCoverImage || (isCloudFile(knowledge.coverImage) ? '' : knowledge.coverImage),
      'knowledge.problems': signedProblems,
    }, () => {
      this.restoreReadingPosition();
    });
  },

  restoreReadingPosition() {
    if (!this.shouldRestorePosition || this.currentScrollTop < 40) {
      this.shouldRestorePosition = false;
      return;
    }

    const scrollTop = this.currentScrollTop;
    this.shouldRestorePosition = false;
    setTimeout(() => {
      wx.pageScrollTo({ scrollTop, duration: 0 });
    }, 120);
  },

  persistReadingPosition() {
    if (!this.readingItem) {
      return;
    }

    const expandedProblems = (this.data.knowledge && this.data.knowledge.problems || [])
      .reduce((ids, problem, index) => (
        problem.expanded ? [...ids, problem.id || String(index)] : ids
      ), []);
    getApp().saveReadingPosition(this.readingItem, this.currentScrollTop, {
      detailsExpanded: this.data.detailsExpanded,
      templateExpanded: this.data.templateExpanded,
      expandedProblems,
    });
  },

  toggleFavorite() {
    const { knowledge, context } = this.data;

    if (!knowledge) {
      return;
    }

    const app = getApp();
    const isFavorite = app.toggleFavorite({
      id: knowledge.id,
      title: knowledge.title,
      subtitle: context ? `${this.data.subjectLabel} · ${context.title}` : `${this.data.subjectLabel}知识点`,
      subjectId: this.subjectId,
      type: 'knowledge',
      containerId: knowledge.containerId || knowledge.chapterId || knowledge.topicId || '',
    });

    this.setData({
      isFavorite,
    });

    wx.showToast({
      title: isFavorite ? '已加入收藏' : '已取消收藏',
      icon: 'none',
    });
  },

  openRelated(event) {
    const { id } = event.currentTarget.dataset;
    this.persistReadingPosition();
    this.shouldRestorePosition = false;
    this.currentScrollTop = 0;
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
    this.loadKnowledge(id);
  },

  openContext() {
    const { context } = this.data;

    if (!context) {
      return;
    }

    const url = this.subjectId === 'math'
      ? `/pages/chapter/index?id=${context.id}`
      : this.subjectId === 'physics' && context.type === 'chapter'
        ? `/pages/physics-chapter/index?id=${context.id}`
        : `/pages/topic/index?subjectId=${this.subjectId}&id=${context.id}`;

    wx.navigateTo({ url });
  },

  openAdjacent(event) {
    const { id } = event.currentTarget.dataset;

    if (!id) {
      return;
    }

    this.persistReadingPosition();
    this.shouldRestorePosition = false;
    this.currentScrollTop = 0;
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
    this.loadKnowledge(id);
  },

  toggleDetails() {
    this.setData({ detailsExpanded: !this.data.detailsExpanded });
  },

  toggleTemplate() {
    this.setData({ templateExpanded: !this.data.templateExpanded });
  },

  toggleProblem(event) {
    const { index } = event.currentTarget.dataset;
    const problem = this.data.knowledge && this.data.knowledge.problems[index];

    if (problem) {
      this.setData({ [`knowledge.problems[${index}].expanded`]: !problem.expanded });
    }
  },

  copyCoreContent() {
    const { knowledge } = this.data;

    if (!knowledge) {
      return;
    }

    const content = [
      knowledge.title,
      knowledge.summary,
      ...(knowledge.knowledgePoints || []).map((item, index) => `${index + 1}. ${item}`),
    ].join('\n');

    wx.setClipboardData({
      data: content,
      success() {
        wx.showToast({ title: '核心要点已复制', icon: 'none' });
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

    if (!tag) {
      return;
    }

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
    const { index } = event.currentTarget.dataset;
    this.setData({
      noteTags: this.data.noteTags.filter((item, itemIndex) => itemIndex !== Number(index)),
      noteDirty: true,
    });
  },

  saveNote() {
    const { knowledge, context } = this.data;
    const note = getApp().saveKnowledgeNote({
      id: knowledge.id,
      title: knowledge.title,
      subtitle: context ? `${this.data.subjectLabel} · ${context.title}` : `${this.data.subjectLabel}知识点`,
      subjectId: this.subjectId,
      containerId: knowledge.containerId || knowledge.chapterId || knowledge.topicId || '',
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

  onPageScroll(event) {
    this.currentScrollTop = event.scrollTop || 0;
  },

  onHide() {
    this.persistReadingPosition();
  },

  onUnload() {
    this.persistReadingPosition();
  },

  onCoverImageError(event) {
    console.warn('知识点封面图加载失败', event.detail);
    this.setData({
      coverImageLoadFailed: true,
    });
  },

  onProblemImageError(event) {
    const { index } = event.currentTarget.dataset;

    console.warn('例题图片加载失败', event.detail);
    this.setData({
      [`knowledge.problems[${index}].imageLoadFailed`]: true,
    });
  },
});
