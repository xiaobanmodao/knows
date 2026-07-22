const { getEnglishUnitById, getEnglishUnitNavigation } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');

Page({
  data: {
    unit: null,
    unitImageLoadFailed: false,
    navigation: null,
    activeSection: 'all',
    sectionOptions: [
      { id: 'all', label: '全部' },
      { id: 'expressions', label: '表达' },
      { id: 'words', label: '单词' },
      { id: 'grammar', label: '语法' },
    ],
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
    this.pendingFocus = options.focusId && ['word', 'grammar'].includes(options.focusType)
      ? { type: options.focusType, id: options.focusId }
      : null;
    const activeSection = this.pendingFocus
      ? (this.pendingFocus.type === 'word' ? 'words' : 'grammar')
      : 'all';
    this.setData({
      unit: {
        ...unit,
        coverImage: isCloudFile(unit.coverImage) ? '' : unit.coverImage,
        vocabulary: unit.vocabulary.map((word) => ({
          ...word,
          spellingVariants: word.spellingVariants || [],
          examples: word.examples || [{
            sentence: word.example,
            translation: word.translation,
            explanation: word.usage,
          }],
          expanded: Boolean(this.pendingFocus && this.pendingFocus.type === 'word' && this.pendingFocus.id === word.id),
          phoneticUkText: word.phonetics ? word.phonetics.uk.join(' / ') : '',
          phoneticUsText: word.phonetics ? word.phonetics.us.join(' / ') : '',
        })),
      },
      unitImageLoadFailed: false,
      navigation: getEnglishUnitNavigation(unit.id),
      activeSection,
    }, () => {
      this.scrollToPendingFocus();
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

  scrollToPendingFocus() {
    if (!this.pendingFocus) {
      return;
    }

    const { type, id } = this.pendingFocus;
    this.pendingFocus = null;
    setTimeout(() => {
      wx.pageScrollTo({
        selector: `#${type}-${id}`,
        duration: 240,
      });
    }, 120);
  },

  openSearch(event) {
    wx.navigateTo({
      url: `/pages/search/index?subjectId=english&q=${encodeURIComponent(event.currentTarget.dataset.keyword)}`,
    });
  },

  setActiveSection(event) {
    const { section } = event.currentTarget.dataset;
    if (['all', 'expressions', 'words', 'grammar'].includes(section)) {
      this.setData({ activeSection: section });
    }
  },

  toggleWord(event) {
    const { id } = event.currentTarget.dataset;
    const index = this.data.unit.vocabulary.findIndex((word) => word.id === id);

    if (index < 0) {
      return;
    }

    this.setData({
      [`unit.vocabulary[${index}].expanded`]: !this.data.unit.vocabulary[index].expanded,
    });
  },

  openSubjectHome() {
    openContent({ subjectId: 'english', type: 'subject' });
  },

  openAdjacentUnit(event) {
    const { id } = event.currentTarget.dataset;

    if (id) {
      openContent({ subjectId: 'english', type: 'unit', id }, { replace: true });
    }
  },

  onUnitImageError() {
    this.setData({ unitImageLoadFailed: true });
  },
});
