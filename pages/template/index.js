const { getTemplateById, getChapterById } = require('../../utils/math');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

Page({
  data: {
    template: null,
    relatedChapters: [],
    figureLoadFailed: false,
  },

  async onLoad(options) {
    const template = getTemplateById(options.id);

    if (!template) {
      wx.showToast({
        title: '模型不存在',
        icon: 'none',
      });
      return;
    }

    wx.setNavigationBarTitle({
      title: template.name,
    });

    this.setData({
      figureLoadFailed: false,
      template: {
        ...template,
        figure: isCloudFile(template.figure) ? '' : template.figure,
      },
      relatedChapters: template.relatedChapters.map((chapterId) => getChapterById(chapterId)).filter(Boolean),
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

  openChapter(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/chapter/index?id=${id}`,
    });
  },

  onImageError(event) {
    console.warn('模型图片加载失败', event.detail);
    this.setData({
      figureLoadFailed: true,
    });
  },
});
