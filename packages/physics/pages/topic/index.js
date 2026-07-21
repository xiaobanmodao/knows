const { getTopicById, normalizeSubjectId, SUBJECT_LABELS } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');

Page({
  data: {
    topic: null,
    subjectLabel: '',
    imageLoadFailed: false,
    diagramImageLoadFailed: false,
  },

  async onLoad(options) {
    const subjectId = normalizeSubjectId(options.subjectId);
    const topic = getTopicById(subjectId, options.id);

    if (!topic) {
      wx.showToast({ title: '专题不存在', icon: 'none' });
      return;
    }

    this.subjectId = subjectId;
    wx.setNavigationBarTitle({ title: topic.title });
    this.setData({
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
    const fileMap = await getTempFileURLMap([sourceImage, topic.diagramImage]);
    const signedImage = applyTempFileURL(sourceImage, fileMap);
    const signedDiagram = applyTempFileURL(topic.diagramImage, fileMap);

    this.setData({
      'topic.coverImage': signedImage || (isCloudFile(sourceImage) ? '' : sourceImage),
      'topic.diagramImage': signedDiagram || (isCloudFile(topic.diagramImage) ? '' : topic.diagramImage),
    });
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
