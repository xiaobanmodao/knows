const { getTopicById, normalizeSubjectId, SUBJECT_LABELS } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');

Page({
  data: {
    loading: true,
    notFound: '',
    topic: null,
    subjectLabel: '',
    imageLoadFailed: false,
    diagramImageLoadFailed: false,
  },

  async onLoad(options = {}) {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    this.setData({ loading: true, notFound: '' });

    try {
      const subjectId = normalizeSubjectId(options.subjectId);
      this.subjectId = subjectId;
      this.currentTopicId = options.id || this.currentTopicId || '';
      const topic = getTopicById(subjectId, options.id);
      if (!topic) throw new Error('专题不存在');

      wx.setNavigationBarTitle({ title: topic.title });
      this.setData({
        loading: false,
        notFound: '',
        subjectLabel: SUBJECT_LABELS[subjectId],
        topic: {
          ...topic,
          gradeText: Array.isArray(topic.gradeBands) ? topic.gradeBands.join(' · ') : (topic.grade || ''),
          coverImage: isCloudFile(topic.coverImage || topic.image) ? '' : (topic.coverImage || topic.image),
          diagramImage: isCloudFile(topic.diagramImage) ? '' : topic.diagramImage,
        },
        imageLoadFailed: false,
        diagramImageLoadFailed: false,
      });

      const sourceImage = topic.coverImage || topic.image;
      try {
        const fileMap = await getTempFileURLMap([sourceImage, topic.diagramImage]);
        if (!this.pageActive || this.assetRequestToken !== requestToken) return;
        const signedImage = applyTempFileURL(sourceImage, fileMap);
        const signedDiagram = applyTempFileURL(topic.diagramImage, fileMap);
        this.setData({
          'topic.coverImage': signedImage || (isCloudFile(sourceImage) ? '' : sourceImage),
          'topic.diagramImage': signedDiagram || (isCloudFile(topic.diagramImage) ? '' : topic.diagramImage),
        });
      } catch (error) {
        // 图片地址失败时保留专题结构和知识入口。
      }
    } catch (error) {
      if (!this.pageActive || this.assetRequestToken !== requestToken) return;
      this.setData({ loading: false, topic: null, notFound: '当前物理专题暂未打开，请重试。' });
    }
  },

  onUnload() {
    this.pageActive = false;
    this.assetRequestToken = (this.assetRequestToken || 0) + 1;
  },

  reopen() {
    this.onLoad({ subjectId: this.subjectId, id: this.currentTopicId });
  },

  openChapter(event) {
    openContent({ subjectId: this.subjectId, type: 'chapter', id: event.currentTarget.dataset.id });
  },

  openSubjectHome() {
    openContent({ subjectId: this.subjectId, type: 'subject' });
  },

  openKnowledge(event) {
    openContent({ subjectId: this.subjectId, type: 'knowledge', id: event.currentTarget.dataset.id });
  },

  openTemplate(event) {
    openContent({ subjectId: this.subjectId, type: 'template', id: event.currentTarget.dataset.id });
  },

  onImageError() {
    this.setData({ imageLoadFailed: true });
  },

  onDiagramImageError() {
    this.setData({ diagramImageLoadFailed: true });
  },
});
