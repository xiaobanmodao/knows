const { getSubjectHome } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openBiologyContent } = require('../../content-routes');

function prepareTopics(topics, fileMap = {}) {
  return (topics || []).map((topic) => ({
    ...topic,
    gradeText: (topic.gradeBands || []).join(' · '),
    coverImage: applyTempFileURL(topic.coverImage, fileMap) || (isCloudFile(topic.coverImage) ? '' : topic.coverImage),
    hasCoverImage: Boolean(topic.coverImage),
    imageLoadFailed: false,
  }));
}

Page({
  data: {
    loading: true,
    subject: null,
    topics: [],
    notFound: '',
  },

  async onLoad() {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    this.setData({ loading: true, notFound: '' });

    try {
      const home = getSubjectHome();
      if (!home || !home.subject) {
        throw new Error('生物内容暂未找到');
      }

      const topics = Array.isArray(home.topics) ? home.topics : [];
      wx.setNavigationBarTitle({ title: home.subject.name });
      this.setData({
        loading: false,
        subject: home.subject,
        topics: prepareTopics(topics),
        notFound: '',
      });

      const imagePaths = topics.map((topic) => topic.coverImage).filter(Boolean);
      try {
        const fileMap = await getTempFileURLMap(imagePaths);
        if (!this.pageActive || this.assetRequestToken !== requestToken) return;
        this.setData({ topics: prepareTopics(topics, fileMap) });
      } catch (error) {
        // 图片地址失败时保留已经展示的文字内容。
      }
    } catch (error) {
      if (!this.pageActive || this.assetRequestToken !== requestToken) return;
      this.setData({
        loading: false,
        subject: null,
        topics: [],
        notFound: '当前生物内容暂未打开，请重试。',
      });
    }
  },

  onUnload() {
    this.pageActive = false;
    this.assetRequestToken = (this.assetRequestToken || 0) + 1;
  },

  openTopic(event) {
    openBiologyContent({ type: 'topic', id: event.currentTarget.dataset.id });
  },

  onImageError(event) {
    const { index } = event.currentTarget.dataset;
    this.setData({ [`topics[${index}].imageLoadFailed`]: true });
  },

  reopen() {
    this.onLoad();
  },
});
