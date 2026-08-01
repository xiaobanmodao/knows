const { getSubjectHome } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openChemistryContent } = require('../../content-routes');

function prepareThemes(themes, fileMap = {}) {
  return themes.map((theme) => ({
    ...theme,
    topics: theme.topics.map((topic) => ({
      ...topic,
      gradeText: topic.gradeBands.join(' · '),
      coverImage: applyTempFileURL(topic.coverImage, fileMap) || (isCloudFile(topic.coverImage) ? '' : topic.coverImage),
      hasCoverImage: Boolean(topic.coverImage),
      imageLoadFailed: false,
    })),
  }));
}

Page({
  data: {
    subject: null,
    themes: [],
    notFound: '',
  },

  async onLoad() {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    const home = getSubjectHome();

    if (!home || !home.subject) {
      this.setData({ notFound: '化学内容暂未找到，请返回后重新打开。' });
      return;
    }

    wx.setNavigationBarTitle({ title: home.subject.name });
    this.setData({
      subject: home.subject,
      themes: prepareThemes(home.themes),
      notFound: '',
    });

    const imagePaths = home.topics.map((topic) => topic.coverImage).filter(Boolean);
    const fileMap = await getTempFileURLMap(imagePaths);
    if (!this.pageActive || this.assetRequestToken !== requestToken) return;
    this.setData({ themes: prepareThemes(home.themes, fileMap) });
  },

  onUnload() {
    this.pageActive = false;
    this.assetRequestToken = (this.assetRequestToken || 0) + 1;
  },

  openTopic(event) {
    openChemistryContent({ type: 'topic', id: event.currentTarget.dataset.id });
  },

  onImageError(event) {
    const { themeIndex, topicIndex } = event.currentTarget.dataset;
    this.setData({ [`themes[${themeIndex}].topics[${topicIndex}].imageLoadFailed`]: true });
  },

  reopen() {
    this.onLoad();
  },
});
