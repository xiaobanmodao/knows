const { getPhysicsChapterById, getPhysicsChapterNavigation } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');

Page({
  data: {
    chapter: null,
    diagramLoadFailed: false,
    navigation: null,
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
      navigation: getPhysicsChapterNavigation(chapter.id),
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
    openContent({ subjectId: 'physics', type: 'knowledge', id: event.currentTarget.dataset.id });
  },

  openTemplate() {
    openContent({ subjectId: 'physics', type: 'template', id: this.data.chapter.template.id });
  },

  openSubjectHome() {
    openContent({ subjectId: 'physics', type: 'subject' });
  },

  openAdjacentChapter(event) {
    const { id } = event.currentTarget.dataset;

    if (id) {
      openContent({ subjectId: 'physics', type: 'chapter', id }, { replace: true });
    }
  },

  onImageError() {
    this.setData({ diagramLoadFailed: true });
  },
});
