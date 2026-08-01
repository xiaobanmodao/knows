const { getTemplateById, getTopicById } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');

Page({
  data: {
    template: null,
    relatedTopics: [],
    isFavorite: false,
    figureLoadFailed: false,
    notFound: '',
  },

  async onLoad(options) {
    this.templateId = options.id;
    const template = getTemplateById(options.id);

    if (!template) {
      this.setData({ notFound: '没有找到这个化学方法，请返回专题目录重新选择。' });
      return;
    }

    wx.setNavigationBarTitle({ title: template.name });
    const relatedTopics = template.topicIds.map((topicId) => getTopicById(topicId)).filter(Boolean);
    const app = getApp();
    app.refreshSession();
    app.addRecent({
      id: template.id,
      title: template.name,
      subtitle: `化学 · ${template.category}`,
      subjectId: 'chemistry',
      type: 'template',
      containerId: template.containerId,
    });

    this.setData({
      template: {
        ...template,
        figure: isCloudFile(template.figure) ? '' : template.figure,
        hasFigure: Boolean(template.figure),
      },
      relatedTopics,
      isFavorite: app.globalData.favorites.some((item) => (
        item.id === template.id
        && (item.subjectId || 'math') === 'chemistry'
        && item.type === 'template'
      )),
      figureLoadFailed: false,
      notFound: '',
    });

    const fileMap = await getTempFileURLMap([template.figure]);
    if (this.templateId !== template.id) return;
    this.setData({
      'template.figure': applyTempFileURL(template.figure, fileMap) || (isCloudFile(template.figure) ? '' : template.figure),
      figureLoadFailed: false,
    });
  },

  onShow() {
    if (!this.data.template) return;
    const app = getApp();
    app.refreshSession();
    this.setData({
      isFavorite: app.globalData.favorites.some((item) => (
        item.id === this.data.template.id
        && (item.subjectId || 'math') === 'chemistry'
        && item.type === 'template'
      )),
    });
  },

  toggleFavorite() {
    const { template } = this.data;
    if (!template) return;
    const isFavorite = getApp().toggleFavorite({
      id: template.id,
      title: template.name,
      subtitle: `化学 · ${template.category}`,
      subjectId: 'chemistry',
      type: 'template',
      containerId: template.containerId,
    });
    this.setData({ isFavorite });
    wx.showToast({ title: isFavorite ? '已加入收藏' : '已取消收藏', icon: 'none' });
  },

  openSubjectHome() {
    openContent({ subjectId: 'chemistry', type: 'subject' });
  },

  openTopic(event) {
    openContent({ subjectId: 'chemistry', type: 'topic', id: event.currentTarget.dataset.id });
  },

  onImageError(event) {
    console.warn('化学方法图加载失败', event.detail);
    this.setData({ figureLoadFailed: true });
  },

  reopen() {
    this.onLoad({ id: this.templateId || '' });
  },
});
