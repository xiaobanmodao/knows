const { getPhysicsChapterById } = require('../../utils/subjects');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

Page({
  data: {
    chapter: null,
    diagramLoadFailed: false,
  },

  async onLoad(options) {
    this.pageActive = true;
    const chapter = getPhysicsChapterById(options.id);

    if (!chapter) {
      wx.showToast({ title: '物理章节不存在', icon: 'none' });
      return;
    }

    const experimentCount = chapter.knowledgeItems.filter((knowledge) => (
      knowledge.sections.some((section) => section.type === 'experiment')
    )).length;
    const app = getApp();
    app.refreshSession();
    app.addRecent({
      id: chapter.id,
      title: chapter.title,
      subtitle: `物理 · ${chapter.bookLabel} · ${chapter.chapterLabel}`,
      subjectId: 'physics',
      type: 'chapter',
      containerId: chapter.bookId,
    });

    wx.setNavigationBarTitle({ title: chapter.title });
    this.setData({
      diagramLoadFailed: false,
      chapter: {
        ...chapter,
        experimentCount,
        diagramImage: isCloudFile(chapter.diagramImage) ? '' : chapter.diagramImage,
      },
    });

    const fileMap = await getTempFileURLMap([chapter.diagramImage]);
    const signedImage = applyTempFileURL(chapter.diagramImage, fileMap);

    if (this.pageActive && signedImage) {
      this.setData({
        diagramLoadFailed: false,
        'chapter.diagramImage': signedImage,
      });
    }
  },

  onUnload() {
    this.pageActive = false;
  },

  openKnowledge(event) {
    wx.navigateTo({
      url: `/pages/knowledge/index?subjectId=physics&id=${event.currentTarget.dataset.id}`,
    });
  },

  openTemplate() {
    wx.navigateTo({
      url: `/pages/template/index?subjectId=physics&id=${this.data.chapter.template.id}`,
    });
  },

  onImageError() {
    this.setData({ diagramLoadFailed: true });
  },
});
