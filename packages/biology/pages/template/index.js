const { getTemplateById, getTopicById } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openBiologyContent } = require('../../content-routes');

Page({
  data: {
    loading: true,
    template: null,
    relatedTopics: [],
    isFavorite: false,
    figureLoadFailed: false,
    notFound: '',
  },

  async onLoad(options = {}) {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    this.currentTemplateId = options.id || this.currentTemplateId || '';
    this.templateId = this.currentTemplateId;
    this.setData({ loading: true, template: null, relatedTopics: [], notFound: '' });

    try {
      const template = getTemplateById(this.currentTemplateId);
      if (!template) throw new Error('生物方法不存在');

      wx.setNavigationBarTitle({ title: template.name });
      const relatedTopics = template.topicIds.map((topicId) => getTopicById(topicId)).filter(Boolean);
      const app = getApp();
      app.refreshSession();
      app.addRecent({
        id: template.id,
        title: template.name,
        subtitle: `生物 · ${template.category}`,
        subjectId: 'biology',
        type: 'template',
        containerId: template.containerId,
      });

      this.setData({
        loading: false,
        template: {
          ...template,
          figure: isCloudFile(template.figure) ? '' : template.figure,
          hasFigure: Boolean(template.figure),
          keywords: template.keywords || [],
          cues: template.cues || [],
          examples: template.examples || [],
        },
        relatedTopics,
        isFavorite: app.globalData.favorites.some((item) => (
          item.id === template.id
          && (item.subjectId || 'math') === 'biology'
          && item.type === 'template'
        )),
        figureLoadFailed: false,
        notFound: '',
      });

      try {
        const fileMap = await getTempFileURLMap([template.figure]);
        if (!this.pageActive || this.assetRequestToken !== requestToken || this.currentTemplateId !== template.id) return;
        this.setData({
          'template.figure': applyTempFileURL(template.figure, fileMap) || (isCloudFile(template.figure) ? '' : template.figure),
          figureLoadFailed: false,
        });
      } catch (error) {
        // 图片地址失败时保留已经展示的文字内容。
      }
    } catch (error) {
      if (!this.pageActive || this.assetRequestToken !== requestToken) return;
      this.setData({ loading: false, template: null, relatedTopics: [], notFound: '当前生物方法暂未打开，请重试。' });
    }
  },

  onShow() {
    if (!this.data.template) return;
    const app = getApp();
    app.refreshSession();
    this.setData({
      isFavorite: app.globalData.favorites.some((item) => (
        item.id === this.data.template.id
        && (item.subjectId || 'math') === 'biology'
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
      subtitle: `生物 · ${template.category}`,
      subjectId: 'biology',
      type: 'template',
      containerId: template.containerId,
    });
    this.setData({ isFavorite });
    wx.showToast({ title: isFavorite ? '已加入收藏' : '已取消收藏', icon: 'none' });
  },

  openSubjectHome() {
    openBiologyContent({ type: 'subject' });
  },

  openTopic(event) {
    openBiologyContent({ type: 'topic', id: event.currentTarget.dataset.id });
  },

  onUnload() {
    this.pageActive = false;
    this.assetRequestToken = (this.assetRequestToken || 0) + 1;
  },

  onImageError(event) {
    console.warn('生物方法图加载失败', event.detail);
    this.setData({ figureLoadFailed: true });
  },

  reopen() {
    this.onLoad({ id: this.currentTemplateId || '' });
  },
});
