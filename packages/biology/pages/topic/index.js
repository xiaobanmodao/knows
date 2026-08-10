const { getTopicById } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openBiologyContent } = require('../../content-routes');

Page({
  data: {
    loading: true,
    topic: null,
    imageLoadFailed: false,
    notFound: '',
  },

  async onLoad(options = {}) {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    this.currentTopicId = options.id || this.currentTopicId || '';
    this.topicId = this.currentTopicId;
    this.setData({ loading: true, topic: null, notFound: '' });

    try {
      const topic = getTopicById(this.currentTopicId);
      if (!topic) throw new Error('生物单元不存在');

      wx.setNavigationBarTitle({ title: topic.title });
      this.setData({
        loading: false,
        topic: {
          ...topic,
          gradeText: (topic.gradeBands || []).join(' · '),
          coverImage: isCloudFile(topic.coverImage) ? '' : topic.coverImage,
          hasCoverImage: Boolean(topic.coverImage),
        },
        imageLoadFailed: false,
        notFound: '',
      });

      try {
        const fileMap = await getTempFileURLMap([topic.coverImage]);
        if (!this.pageActive || this.assetRequestToken !== requestToken || this.currentTopicId !== topic.id) return;
        this.setData({
          'topic.coverImage': applyTempFileURL(topic.coverImage, fileMap) || (isCloudFile(topic.coverImage) ? '' : topic.coverImage),
          imageLoadFailed: false,
        });
      } catch (error) {
        // 图片地址失败时保留已经展示的文字内容。
      }
    } catch (error) {
      if (!this.pageActive || this.assetRequestToken !== requestToken) return;
      this.setData({ loading: false, topic: null, notFound: '当前生物单元暂未打开，请重试。' });
    }
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
    this.onLoad({ id: this.currentTopicId || '' });
  },
});
