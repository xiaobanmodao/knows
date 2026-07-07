const { getChapterById } = require('../../utils/math');
const { applyTempFileURL, getTempFileURLMap } = require('../../utils/cloud-assets');

Page({
  data: {
    chapter: null,
  },

  async onLoad(options) {
    const chapter = getChapterById(options.id);

    if (!chapter) {
      wx.showToast({
        title: '章节不存在',
        icon: 'none',
      });
      return;
    }

    wx.setNavigationBarTitle({
      title: chapter.title,
    });

    const image = chapter.chapterFigure && chapter.chapterFigure.image;
    const fileMap = await getTempFileURLMap([image]);

    this.setData({
      chapter: {
        ...chapter,
        chapterFigure: {
          ...chapter.chapterFigure,
          image: applyTempFileURL(image, fileMap),
        },
      },
    });
  },

  openKnowledge(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/knowledge/index?id=${id}`,
    });
  },

  onImageError(event) {
    console.warn('章节图片加载失败', event.detail);
  },
});
