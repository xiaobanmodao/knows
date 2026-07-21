const {
  getChapterById = () => null,
  getTemplateById,
  getTopicById,
  getPhysicsChapterById,
  normalizeSubjectId,
  SUBJECT_LABELS,
} = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');

Page({
  data: {
    template: null,
    relatedChapters: [],
    relatedTopics: [],
    subjectLabel: '',
    isFavorite: false,
    figureLoadFailed: false,
  },

  async onLoad(options) {
    this.subjectId = normalizeSubjectId(options.subjectId);
    const template = getTemplateById(this.subjectId, options.id);

    if (!template) {
      wx.showToast({
        title: '方法模板不存在',
        icon: 'none',
      });
      return;
    }

    wx.setNavigationBarTitle({
      title: template.name,
    });

    const relatedChapters = this.subjectId === 'math'
      ? (template.relatedChapters || []).map((chapterId) => getChapterById(chapterId)).filter(Boolean)
      : this.subjectId === 'physics'
        ? (template.chapterIds || []).map((chapterId) => getPhysicsChapterById(chapterId)).filter(Boolean)
        : [];
    const relatedTopics = this.subjectId === 'math'
      ? []
      : (template.topicIds || []).map((topicId) => getTopicById(this.subjectId, topicId)).filter(Boolean);
    const app = getApp();
    app.refreshSession();
    app.addRecent({
      id: template.id,
      title: template.name,
      subtitle: `${SUBJECT_LABELS[this.subjectId]} · ${template.category}`,
      subjectId: this.subjectId,
      type: 'template',
      containerId: template.containerId || '',
    });

    this.setData({
      figureLoadFailed: false,
      subjectLabel: SUBJECT_LABELS[this.subjectId],
      isFavorite: app.globalData.favorites.some((item) => item.id === template.id && (item.subjectId || 'math') === this.subjectId && item.type === 'template'),
      template: {
        ...template,
        figure: isCloudFile(template.figure) ? '' : template.figure,
      },
      relatedChapters,
      relatedTopics,
    });

    const fileMap = await getTempFileURLMap([template.figure]);
    const signedFigure = applyTempFileURL(template.figure, fileMap);

    if (signedFigure) {
      this.setData({
        figureLoadFailed: false,
        'template.figure': signedFigure,
      });
    }
  },

  onShow() {
    if (!this.data.template) {
      return;
    }

    const app = getApp();
    app.refreshSession();
    this.setData({
      isFavorite: app.globalData.favorites.some((item) => item.id === this.data.template.id && (item.subjectId || 'math') === this.subjectId && item.type === 'template'),
    });
  },

  toggleFavorite() {
    const { template } = this.data;
    const app = getApp();
    const isFavorite = app.toggleFavorite({
      id: template.id,
      title: template.name,
      subtitle: `${this.data.subjectLabel} · ${template.category}`,
      subjectId: this.subjectId,
      type: 'template',
      containerId: template.containerId || '',
    });
    this.setData({ isFavorite });
    wx.showToast({ title: isFavorite ? '已加入收藏' : '已取消收藏', icon: 'none' });
  },

  openSubjectHome() {
    openContent({ subjectId: this.subjectId, type: 'subject' });
  },

  openChapter(event) {
    const { id } = event.currentTarget.dataset;
    openContent({ subjectId: this.subjectId, type: 'chapter', id });
  },

  openTopic(event) {
    const { id } = event.currentTarget.dataset;
    openContent({ subjectId: this.subjectId, type: 'topic', id });
  },

  onImageError(event) {
    console.warn('模型图片加载失败', event.detail);
    this.setData({
      figureLoadFailed: true,
    });
  },
});
