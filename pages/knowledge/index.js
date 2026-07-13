const { getKnowledgeById, getChapterById } = require('../../utils/math');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

Page({
  data: {
    knowledge: null,
    chapter: null,
    isFavorite: false,
    relatedItems: [],
    coverImageLoadFailed: false,
  },

  onLoad(options) {
    this.loadKnowledge(options.id);
  },

  onShow() {
    const { knowledge } = this.data;

    if (knowledge) {
      const app = getApp();
      app.refreshSession();
      this.setData({
        isFavorite: app.globalData.favorites.some((item) => item.id === knowledge.id),
      });
    }
  },

  async loadKnowledge(knowledgeId) {
    this.currentKnowledgeId = knowledgeId;

    const knowledge = getKnowledgeById(knowledgeId);

    if (!knowledge) {
      wx.showToast({
        title: '知识点不存在',
        icon: 'none',
      });
      return;
    }

    const chapter = getChapterById(knowledge.chapterId);
    const relatedItems = chapter
      ? chapter.knowledgeItems.filter((item) => item.id !== knowledge.id).slice(0, 4)
      : [];
    const app = getApp();

    app.refreshSession();
    app.addRecent({
      id: knowledge.id,
      title: knowledge.title,
      subtitle: chapter ? `${chapter.stage} · ${chapter.title}` : '数学知识点',
      type: 'knowledge',
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
      chapter,
      relatedItems,
      coverImageLoadFailed: false,
      isFavorite: app.globalData.favorites.some((item) => item.id === knowledge.id),
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
    const { knowledge, chapter } = this.data;

    if (!knowledge) {
      return;
    }

    const app = getApp();
    const isFavorite = app.toggleFavorite({
      id: knowledge.id,
      title: knowledge.title,
      subtitle: chapter ? `${chapter.stage} · ${chapter.title}` : '数学知识点',
      type: 'knowledge',
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
