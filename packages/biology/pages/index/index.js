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
    subject: null,
    topics: [],
    notFound: '',
  },

  async onLoad() {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    const home = getSubjectHome();

    if (!home || !home.subject) {
      this.setData({ notFound: '生物内容暂未找到，请返回后重新打开。' });
      return;
    }

    wx.setNavigationBarTitle({ title: home.subject.name });
    this.setData({
      subject: home.subject,
      topics: prepareTopics(home.topics),
      notFound: '',
    });

    const imagePaths = home.topics.map((topic) => topic.coverImage).filter(Boolean);
    const fileMap = await getTempFileURLMap(imagePaths);
    if (!this.pageActive || this.assetRequestToken !== requestToken) return;
    this.setData({ topics: prepareTopics(home.topics, fileMap) });
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
