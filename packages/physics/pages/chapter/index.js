const { getPhysicsChapterById, getPhysicsChapterNavigation } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');

Page({
  data: {
    loading: true,
    notFound: '',
    chapter: null,
    diagramLoadFailed: false,
    navigation: null,
  },

  async onLoad(options = {}) {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    this.setData({ loading: true, notFound: '' });
    this.currentChapterId = options.id || this.currentChapterId || '';

    try {
      const chapter = getPhysicsChapterById(options.id);
      if (!chapter) throw new Error('物理章节不存在');

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
        loading: false,
        notFound: '',
        diagramLoadFailed: false,
        chapter: {
          ...chapter,
          experimentCount,
          diagramImage: isCloudFile(chapter.diagramImage) ? '' : chapter.diagramImage,
        },
        navigation: getPhysicsChapterNavigation(chapter.id),
      });

      try {
        const fileMap = await getTempFileURLMap([chapter.diagramImage]);
        if (!this.pageActive || this.assetRequestToken !== requestToken) return;
        const signedImage = applyTempFileURL(chapter.diagramImage, fileMap);
        if (signedImage) {
          this.setData({ diagramLoadFailed: false, 'chapter.diagramImage': signedImage });
        }
      } catch (error) {
        // 图片地址失败时保留章节文字和知识入口。
      }
    } catch (error) {
      if (!this.pageActive || this.assetRequestToken !== requestToken) return;
      this.setData({ loading: false, chapter: null, notFound: '当前物理章节暂未打开，请重试。' });
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
