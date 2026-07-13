const { getChapterGroups, getMathStudyMap } = require('../../utils/math');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

Page({
  data: {
    chapterGroups: [],
    studyMap: {},
    totalChapters: 0,
  },

  async onLoad() {
    const chapterGroups = getChapterGroups();
    const studyMap = getMathStudyMap();
    const displayStudyMap = {
      ...studyMap,
      grade8Topics: studyMap.grade8Topics.map((topic) => ({
        ...topic,
        image: isCloudFile(topic.image) ? '' : topic.image,
      })),
    };

    this.setData({
      chapterGroups,
      studyMap: displayStudyMap,
      totalChapters: chapterGroups.reduce((sum, group) => sum + group.items.length, 0),
    });

    const topicImages = studyMap.grade8Topics.map((topic) => topic.image).filter(Boolean);
    const fileMap = await getTempFileURLMap(topicImages);
    const grade8Topics = studyMap.grade8Topics.map((topic) => ({
      ...topic,
      image: applyTempFileURL(topic.image, fileMap) || (isCloudFile(topic.image) ? '' : topic.image),
    }));

    this.setData({
      'studyMap.grade8Topics': grade8Topics,
    });
  },

  openSearch() {
    wx.navigateTo({
      url: '/pages/search/index',
    });
  },

  openChapter(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/chapter/index?id=${id}`,
    });
  },

  onTopicImageError(event) {
    const { id } = event.currentTarget.dataset;
    const index = (this.data.studyMap.grade8Topics || []).findIndex((topic) => topic.id === id);

    if (index >= 0) {
      this.setData({
        [`studyMap.grade8Topics[${index}].image`]: '',
      });
    }
  },
});
