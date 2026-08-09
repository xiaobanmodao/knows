const { getTopicById } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openBiologyContent } = require('../../content-routes');

Page({
  data: {
    topic: null,
    imageLoadFailed: false,
    notFound: '',
  },

  async onLoad(options) {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    this.topicId = options.id;
    const topic = getTopicById(options.id);

    if (!topic) {
      this.setData({ notFound: '没有找到这个生物单元，请返回单元目录重新选择。' });
      return;
    }

    wx.setNavigationBarTitle({ title: topic.title });
    this.setData({
      topic: {
        ...topic,
        gradeText: (topic.gradeBands || []).join(' · '),
        coverImage: isCloudFile(topic.coverImage) ? '' : topic.coverImage,
        hasCoverImage: Boolean(topic.coverImage),
      },
      imageLoadFailed: false,
      notFound: '',
    });

    const imagePaths = [
      topic.coverImage,
    ].filter(Boolean);
    const fileMap = await getTempFileURLMap(imagePaths);
    if (!this.pageActive || this.assetRequestToken !== requestToken || this.topicId !== topic.id) return;
    this.setData({
      'topic.coverImage': applyTempFileURL(topic.coverImage, fileMap) || (isCloudFile(topic.coverImage) ? '' : topic.coverImage),
      imageLoadFailed: false,
    });
  },

  onUnload() {
    this.pageActive = false;
    this.assetRequestToken = (this.assetRequestToken || 0) + 1;
  },

  openSubjectHome() {
    openBiologyContent({ type: 'subject' });
  },

  openKnowledge(event) {
    openBiologyContent({ type: 'knowledge', id: event.currentTarget.dataset.id });
  },

  openTemplate(event) {
    openBiologyContent({ type: 'template', id: event.currentTarget.dataset.id });
  },

  onImageError() {
    this.setData({ imageLoadFailed: true });
  },

  reopen() {
    this.onLoad({ id: this.topicId || '' });
  },
});
