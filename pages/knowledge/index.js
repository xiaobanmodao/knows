const { getKnowledgeById, getChapterById } = require('../../utils/math');
const { applyTempFileURL, getTempFileURLMap } = require('../../utils/cloud-assets');

Page({
  data: {
    knowledge: null,
    chapter: null,
    isFavorite: false,
    relatedItems: [],
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

    const imagePaths = [
      knowledge.coverImage,
      ...(knowledge.problems || []).map((problem) => problem.image),
    ];
    const fileMap = await getTempFileURLMap(imagePaths);
    const displayKnowledge = {
      ...knowledge,
      coverImage: applyTempFileURL(knowledge.coverImage, fileMap),
      problems: (knowledge.problems || []).map((problem) => ({
        ...problem,
        image: applyTempFileURL(problem.image, fileMap),
      })),
    };

    this.setData({
      knowledge: displayKnowledge,
      chapter,
      relatedItems,
      isFavorite: app.globalData.favorites.some((item) => item.id === knowledge.id),
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

  onImageError(event) {
    console.warn('知识点图片加载失败', event.detail);
  },
});
