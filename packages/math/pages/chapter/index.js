const { getChapterById, getAllChapters } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');

Page({
  data: {
    loading: true,
    notFound: '',
    chapter: null,
    chapterFigureLoadFailed: false,
    navigation: null,
  },

  async onLoad(options = {}) {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    this.setData({ loading: true, notFound: '' });
    this.currentChapterId = options.id || this.currentChapterId || '';

    try {
      const chapter = getChapterById(options.id);
      if (!chapter) throw new Error('章节不存在');

      wx.setNavigationBarTitle({ title: chapter.title });
      this.setData({
        loading: false,
        notFound: '',
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
      try {
        const fileMap = await getTempFileURLMap([image]);
        if (!this.pageActive || this.assetRequestToken !== requestToken) return;
        const signedImage = applyTempFileURL(image, fileMap);
        if (signedImage) {
          this.setData({
            chapterFigureLoadFailed: false,
            'chapter.chapterFigure.image': signedImage,
          });
        }
      } catch (error) {
        // 图片地址失败时保留章节文字和知识入口。
      }
    } catch (error) {
      if (!this.pageActive || this.assetRequestToken !== requestToken) return;
      this.setData({ loading: false, chapter: null, notFound: '当前数学章节暂未打开，请重试。' });
    }
  },

  onUnload() {
    this.pageActive = false;
    this.assetRequestToken = (this.assetRequestToken || 0) + 1;
  },

  reopen() {
    this.onLoad({ id: this.currentChapterId });
  },

  openKnowledge(event) {
    const { id } = event.currentTarget.dataset;
    openContent({ subjectId: 'math', type: 'knowledge', id });
  },

  openTemplate(event) {
    openContent({ subjectId: 'math', type: 'template', id: event.currentTarget.dataset.id });
  },

  openMathHome() {
    openContent({ subjectId: 'math', type: 'subject' });
  },

  openAdjacentChapter(event) {
    const { id } = event.currentTarget.dataset;

    if (id) {
      openContent({ subjectId: 'math', type: 'chapter', id }, { replace: true });
    }
  },

  onImageError(event) {
    console.warn('章节图片加载失败', event.detail);
    this.setData({
      chapterFigureLoadFailed: true,
    });
  },
});
