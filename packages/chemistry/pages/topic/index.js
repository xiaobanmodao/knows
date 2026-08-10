const { getTopicById } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openChemistryContent } = require('../../content-routes');

function prepareDiagramImages(diagrams, fileMap = {}) {
  return (diagrams || []).map((diagram) => ({
    ...diagram,
    image: applyTempFileURL(diagram.image, fileMap) || (isCloudFile(diagram.image) ? '' : diagram.image),
    hasImage: Boolean(diagram.image),
    imageLoadFailed: false,
  }));
}

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
      if (!topic) throw new Error('化学专题不存在');

      wx.setNavigationBarTitle({ title: topic.title });
      this.setData({
        loading: false,
        topic: {
          ...topic,
          gradeText: topic.gradeBands.join(' · '),
          coverImage: isCloudFile(topic.coverImage) ? '' : topic.coverImage,
          hasCoverImage: Boolean(topic.coverImage),
          diagramImages: prepareDiagramImages(topic.diagramImages),
        },
        imageLoadFailed: false,
        notFound: '',
      });

      const imagePaths = [
        topic.coverImage,
        ...topic.diagramImages.map((diagram) => diagram.image),
      ].filter(Boolean);
      try {
        const fileMap = await getTempFileURLMap(imagePaths);
        if (!this.pageActive || this.assetRequestToken !== requestToken || this.currentTopicId !== topic.id) return;
        this.setData({
          'topic.coverImage': applyTempFileURL(topic.coverImage, fileMap) || (isCloudFile(topic.coverImage) ? '' : topic.coverImage),
          'topic.diagramImages': prepareDiagramImages(topic.diagramImages, fileMap),
          imageLoadFailed: false,
        });
      } catch (error) {
        // 图片地址失败时保留已经展示的文字内容。
      }
    } catch (error) {
      if (!this.pageActive || this.assetRequestToken !== requestToken) return;
      this.setData({ loading: false, topic: null, notFound: '当前化学专题暂未打开，请重试。' });
    }
  },

  onUnload() {
    this.pageActive = false;
    this.assetRequestToken = (this.assetRequestToken || 0) + 1;
  },

  openSubjectHome() {
    openChemistryContent({ type: 'subject' });
  },

  openKnowledge(event) {
    openChemistryContent({ type: 'knowledge', id: event.currentTarget.dataset.id });
  },

  openTemplate(event) {
    openChemistryContent({ type: 'template', id: event.currentTarget.dataset.id });
  },

  onImageError() {
    this.setData({ imageLoadFailed: true });
  },

  onDiagramError(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || index < 0) return;
    this.setData({ [`topic.diagramImages[${index}].imageLoadFailed`]: true });
  },

  reopen() {
    this.onLoad({ id: this.currentTopicId || '' });
  },
});
