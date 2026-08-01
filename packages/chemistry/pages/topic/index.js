const { getTopicById } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');

Page({
  data: {
    topic: null,
    imageLoadFailed: false,
    notFound: '',
  },

  async onLoad(options) {
    this.pageActive = true;
    this.topicId = options.id;
    const topic = getTopicById(options.id);

    if (!topic) {
      this.setData({ notFound: '没有找到这个化学专题，请返回专题目录重新选择。' });
      return;
    }

    wx.setNavigationBarTitle({ title: topic.title });
    this.setData({
      topic: {
        ...topic,
        gradeText: topic.gradeBands.join(' · '),
        coverImage: isCloudFile(topic.coverImage) ? '' : topic.coverImage,
        hasCoverImage: Boolean(topic.coverImage),
      },
      imageLoadFailed: false,
      notFound: '',
    });

    const fileMap = await getTempFileURLMap([topic.coverImage]);
    if (!this.pageActive || this.topicId !== topic.id) return;
    this.setData({
      'topic.coverImage': applyTempFileURL(topic.coverImage, fileMap) || (isCloudFile(topic.coverImage) ? '' : topic.coverImage),
      imageLoadFailed: false,
    });
  },

  onUnload() {
    this.pageActive = false;
  },

  openSubjectHome() {
    openContent({ subjectId: 'chemistry', type: 'subject' });
  },

  openKnowledge(event) {
    openContent({ subjectId: 'chemistry', type: 'knowledge', id: event.currentTarget.dataset.id });
  },

  openTemplate(event) {
    openContent({ subjectId: 'chemistry', type: 'template', id: event.currentTarget.dataset.id });
  },

  onImageError() {
    this.setData({ imageLoadFailed: true });
  },

  reopen() {
    this.onLoad({ id: this.topicId || '' });
  },
});
