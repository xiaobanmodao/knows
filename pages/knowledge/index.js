const {
  getKnowledgeById,
  getKnowledgeContext,
  getRelatedKnowledge,
  normalizeSubjectId,
  SUBJECT_LABELS,
} = require('../../utils/subjects');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

Page({
  data: {
    knowledge: null,
    context: null,
    subjectLabel: '',
    isFavorite: false,
    relatedItems: [],
    coverImageLoadFailed: false,
  },

  onLoad(options) {
    this.subjectId = normalizeSubjectId(options.subjectId);
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
    const relatedItems = getRelatedKnowledge(this.subjectId, knowledge, 4);
    const app = getApp();

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
      problems: (knowledge.problems || []).map((problem) => ({
        ...problem,
        image: isCloudFile(problem.image) ? '' : problem.image,
        imageLoadFailed: false,
      })),
    };

    this.setData({
      knowledge: displayKnowledge,
      context,
      subjectLabel: SUBJECT_LABELS[this.subjectId],
      relatedItems,
      coverImageLoadFailed: false,
      isFavorite: app.globalData.favorites.some((item) => item.id === knowledge.id && (item.subjectId || 'math') === this.subjectId && (item.type || 'knowledge') === 'knowledge'),
    });

    const imagePaths = [
      knowledge.coverImage,
      ...(knowledge.problems || []).map((problem) => problem.image),
    ];
    const fileMap = await getTempFileURLMap(imagePaths);

    if (this.currentKnowledgeId !== knowledgeId) {
      return;
    }

    const signedCoverImage = applyTempFileURL(knowledge.coverImage, fileMap);
    const signedProblems = (knowledge.problems || []).map((problem) => ({
      ...problem,
      image: applyTempFileURL(problem.image, fileMap) || (isCloudFile(problem.image) ? '' : problem.image),
      imageLoadFailed: false,
    }));

    this.setData({
      coverImageLoadFailed: false,
      'knowledge.coverImage': signedCoverImage || (isCloudFile(knowledge.coverImage) ? '' : knowledge.coverImage),
      'knowledge.problems': signedProblems,
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
    this.loadKnowledge(id);
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
