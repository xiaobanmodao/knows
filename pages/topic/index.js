const { getTopicById, normalizeSubjectId, SUBJECT_LABELS } = require('../../utils/subjects');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

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
    const page = this.subjectId === 'physics' ? 'physics-chapter' : 'chapter';
    wx.navigateTo({ url: `/pages/${page}/index?id=${event.currentTarget.dataset.id}` });
  },

  openSubjectHome() {
    const url = this.subjectId === 'math'
      ? '/pages/math/index'
      : `/pages/subject/index?id=${this.subjectId}`;
    wx.navigateTo({ url });
  },

  openKnowledge(event) {
    wx.navigateTo({
      url: `/pages/knowledge/index?subjectId=${this.subjectId}&id=${event.currentTarget.dataset.id}`,
    });
  },

  openTemplate(event) {
    wx.navigateTo({
      url: `/pages/template/index?subjectId=${this.subjectId}&id=${event.currentTarget.dataset.id}`,
    });
  },

  onImageError() {
    this.setData({ imageLoadFailed: true });
  },

  onDiagramImageError() {
    this.setData({ diagramImageLoadFailed: true });
  },
});
