const { getChapterById, getAllChapters } = require('../../utils/math');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

Page({
  data: {
    chapter: null,
    chapterFigureLoadFailed: false,
    navigation: null,
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

    this.setData({
      chapterFigureLoadFailed: false,
      chapter: {
        ...chapter,
        chapterFigure: {
          ...chapter.chapterFigure,
          image: isCloudFile(chapter.chapterFigure.image) ? '' : chapter.chapterFigure.image,
        },
      },
      navigation: (() => {
        const chapters = getAllChapters().filter((item) => item.grade === chapter.grade);
        const index = chapters.findIndex((item) => item.id === chapter.id);
        const toEntry = (item) => item ? { id: item.id, title: item.title } : null;

        return {
          previous: toEntry(chapters[index - 1]),
          next: toEntry(chapters[index + 1]),
        };
      })(),
    });

    const image = chapter.chapterFigure && chapter.chapterFigure.image;
    const fileMap = await getTempFileURLMap([image]);
    const signedImage = applyTempFileURL(image, fileMap);

    if (signedImage) {
      this.setData({
        chapterFigureLoadFailed: false,
        'chapter.chapterFigure.image': signedImage,
      });
    }
  },

  openKnowledge(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/knowledge/index?id=${id}`,
    });
  },

  openMathHome() {
    wx.navigateTo({ url: '/pages/math/index' });
  },

  openAdjacentChapter(event) {
    const { id } = event.currentTarget.dataset;

    if (id) {
      wx.redirectTo({ url: `/pages/chapter/index?id=${id}` });
    }
  },

  onImageError(event) {
    console.warn('章节图片加载失败', event.detail);
    this.setData({
      chapterFigureLoadFailed: true,
    });
  },
});
