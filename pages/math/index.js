const { getChapterGroups, getMathStudyMap } = require('../../utils/math');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

function buildGradeView(gradeId, studyMap, chapterGroups) {
  const activeGradePackage = studyMap.gradePackages.find((grade) => grade.id === gradeId)
    || studyMap.gradePackages[1]
    || studyMap.gradePackages[0]
    || null;
  const selectedGradeId = activeGradePackage ? activeGradePackage.id : 'grade8';
  const activeTopicGroup = studyMap.topicGroups.find((group) => group.gradeId === selectedGradeId)
    || { gradeId: selectedGradeId, title: '', topics: [], topicCount: 0 };
  const visibleChapterGroups = activeGradePackage
    ? chapterGroups.filter((group) => group.grade === activeGradePackage.title)
    : [];

  return {
    selectedGradeId,
    activeGradePackage,
    activeTopicGroup,
    hasActiveTopics: activeTopicGroup.topicCount > 0,
    visibleChapterGroups,
    visibleChapterCount: visibleChapterGroups.reduce((sum, group) => sum + group.items.length, 0),
    gradeOptions: studyMap.gradePackages.map((grade) => {
      const topicGroup = studyMap.topicGroups.find((group) => group.gradeId === grade.id);
      const chapterCount = chapterGroups
        .filter((group) => group.grade === grade.title)
        .reduce((sum, group) => sum + group.items.length, 0);

      return {
        id: grade.id,
        title: grade.title,
        chapterCount,
        topicCount: topicGroup ? topicGroup.topicCount : 0,
        active: grade.id === selectedGradeId,
      };
    }),
  };
}

function getDisplayStudyMap(studyMap) {
  return {
    ...studyMap,
    topicGroups: studyMap.topicGroups.map((group) => ({
      ...group,
      topics: group.topics.map((topic) => ({
        ...topic,
        image: isCloudFile(topic.image) ? '' : topic.image,
      })),
    })),
  };
}

Page({
  data: {
    chapterGroups: [],
    visibleChapterGroups: [],
    studyMap: {},
    gradeOptions: [],
    selectedGradeId: 'grade8',
    activeGradePackage: null,
    activeTopicGroup: null,
    hasActiveTopics: false,
    totalChapters: 0,
    visibleChapterCount: 0,
  },

  async onLoad() {
    const app = getApp();
    const chapterGroups = getChapterGroups();
    const studyMap = getMathStudyMap();
    const displayStudyMap = getDisplayStudyMap(studyMap);
    const selectedGradeId = app.getMathGrade();

    this.setData({
      chapterGroups,
      studyMap: displayStudyMap,
      totalChapters: chapterGroups.reduce((sum, group) => sum + group.items.length, 0),
      ...buildGradeView(selectedGradeId, displayStudyMap, chapterGroups),
    });

    const topicImages = studyMap.topicGroups
      .flatMap((group) => group.topics)
      .map((topic) => topic.image)
      .filter(Boolean);
    const fileMap = await getTempFileURLMap(topicImages);
    const topicGroups = studyMap.topicGroups.map((group) => ({
      ...group,
      topics: group.topics.map((topic) => ({
        ...topic,
        image: applyTempFileURL(topic.image, fileMap) || (isCloudFile(topic.image) ? '' : topic.image),
      })),
    }));
    const signedStudyMap = { ...studyMap, topicGroups };

    this.setData({
      studyMap: signedStudyMap,
      ...buildGradeView(this.data.selectedGradeId, signedStudyMap, chapterGroups),
    });
  },

  selectGrade(event) {
    const app = getApp();
    const gradeId = app.setMathGrade(event.currentTarget.dataset.id);

    this.setData(buildGradeView(gradeId, this.data.studyMap, this.data.chapterGroups));
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

  openTopic(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/topic/index?subjectId=math&id=${id}`,
    });
  },

  onTopicImageError(event) {
    const { gradeId, id } = event.currentTarget.dataset;
    const groupIndex = (this.data.studyMap.topicGroups || []).findIndex((group) => group.gradeId === gradeId);

    if (groupIndex < 0) {
      return;
    }

    const topicIndex = this.data.studyMap.topicGroups[groupIndex].topics.findIndex((topic) => topic.id === id);

    if (topicIndex >= 0) {
      this.setData({
        [`studyMap.topicGroups[${groupIndex}].topics[${topicIndex}].image`]: '',
        [`activeTopicGroup.topics[${topicIndex}].image`]: '',
      });
    }
  },
});
