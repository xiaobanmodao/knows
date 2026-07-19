const { getEnglishUnitById } = require('../../utils/subjects');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

Page({
  data: {
    unit: null,
    unitImageLoadFailed: false,
  },

  async onLoad(options) {
    const unit = getEnglishUnitById(options.id);

    if (!unit) {
      wx.showToast({ title: '未找到该教材单元', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    wx.setNavigationBarTitle({ title: `${unit.unitLabel} ${unit.title}` });
    this.currentUnitId = unit.id;
    this.setData({
      unit: {
        ...unit,
        coverImage: isCloudFile(unit.coverImage) ? '' : unit.coverImage,
      },
      unitImageLoadFailed: false,
    });

    const app = getApp();
    if (app && typeof app.addRecent === 'function') {
      app.addRecent({
        id: unit.id,
        refId: unit.id,
        subjectId: 'english',
        type: 'unit',
        containerId: unit.bookId,
        title: `${unit.unitLabel} ${unit.title}`,
        subtitle: `英语 · ${unit.bookLabel}`,
        description: unit.theme,
      });
    }

    const fileMap = await getTempFileURLMap([unit.coverImage]);

    if (this.currentUnitId !== unit.id) {
      return;
    }

    this.setData({
      'unit.coverImage': applyTempFileURL(unit.coverImage, fileMap) || (isCloudFile(unit.coverImage) ? '' : unit.coverImage),
      unitImageLoadFailed: false,
    });
  },

  openSearch(event) {
    wx.navigateTo({
      url: `/pages/search/index?subjectId=english&q=${encodeURIComponent(event.currentTarget.dataset.keyword)}`,
    });
  },

  onUnitImageError() {
    this.setData({ unitImageLoadFailed: true });
  },
});
