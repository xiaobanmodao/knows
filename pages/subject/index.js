const { getSubjectHome, normalizeSubjectId } = require('../../utils/subjects');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../utils/cloud-assets');

Page({
  data: {
    subject: null,
    topics: [],
    isEnglish: false,
    isPhysics: false,
    books: [],
    selectedBookId: '',
    selectedBook: null,
    units: [],
    physicsBooks: [],
    selectedPhysicsBookId: '',
    selectedPhysicsBook: null,
    physicsChapters: [],
  },

  async onLoad(options) {
    this.pageActive = true;
    const subjectId = normalizeSubjectId(options.id);

    if (subjectId === 'math') {
      wx.redirectTo({ url: '/pages/math/index' });
      return;
    }

    const home = getSubjectHome(subjectId);
    const isEnglish = subjectId === 'english';
    const isPhysics = subjectId === 'physics';
    const books = (home.unitBooks || []).map((book) => ({
      ...book,
      disabled: book.status !== 'verified' || !book.unitCount,
    }));
    const storedBookId = isEnglish ? wx.getStorageSync('englishCurrentBookId') : '';
    const selectedBook = books.find((book) => book.id === storedBookId && !book.disabled)
      || books.find((book) => !book.disabled)
      || null;
    const physicsBooks = home.physicsBooks || [];
    const storedPhysicsBookId = isPhysics ? wx.getStorageSync('physicsCurrentBookId') : '';
    const selectedPhysicsBook = physicsBooks.find((book) => book.id === storedPhysicsBookId)
      || physicsBooks[0]
      || null;
    this.subjectId = subjectId;
    wx.setNavigationBarTitle({ title: home.subject.name });
    this.setData({
      subject: { ...home.subject, gradeText: home.subject.gradeBands.join(' · ') },
      isEnglish,
      isPhysics,
      books,
      selectedBookId: selectedBook ? selectedBook.id : '',
      selectedBook,
      units: selectedBook ? selectedBook.units : [],
      physicsBooks,
      selectedPhysicsBookId: selectedPhysicsBook ? selectedPhysicsBook.id : '',
      selectedPhysicsBook,
      physicsChapters: selectedPhysicsBook ? selectedPhysicsBook.chapters : [],
      topics: home.topics.map((topic) => ({
        ...topic,
        gradeText: topic.gradeBands.join(' / '),
        coverImage: isCloudFile(topic.coverImage) ? '' : topic.coverImage,
        imageLoadFailed: false,
      })),
    });

    const imagePaths = home.topics.map((topic) => topic.coverImage).filter(Boolean);
    const fileMap = await getTempFileURLMap(imagePaths);

    if (!this.pageActive) {
      return;
    }

    this.setData({
      topics: home.topics.map((topic) => ({
        ...topic,
        gradeText: topic.gradeBands.join(' / '),
        coverImage: applyTempFileURL(topic.coverImage, fileMap) || (isCloudFile(topic.coverImage) ? '' : topic.coverImage),
        imageLoadFailed: false,
      })),
    });
  },

  onUnload() {
    this.pageActive = false;
  },

  openTopic(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/topic/index?subjectId=${this.subjectId}&id=${id}`,
    });
  },

  selectBook(event) {
    const { id } = event.currentTarget.dataset;
    const selectedBook = this.data.books.find((book) => book.id === id);

    if (!selectedBook || selectedBook.disabled) {
      wx.showToast({ title: '等待官方目录发布后开放', icon: 'none' });
      return;
    }

    wx.setStorageSync('englishCurrentBookId', selectedBook.id);
    this.setData({
      selectedBookId: selectedBook.id,
      selectedBook,
      units: selectedBook.units,
    });
  },

  openEnglishUnit(event) {
    wx.navigateTo({
      url: `/pages/english-unit/index?id=${event.currentTarget.dataset.id}`,
    });
  },

  selectPhysicsBook(event) {
    const { id } = event.currentTarget.dataset;
    const selectedPhysicsBook = this.data.physicsBooks.find((book) => book.id === id);

    if (!selectedPhysicsBook) {
      return;
    }

    wx.setStorageSync('physicsCurrentBookId', selectedPhysicsBook.id);
    this.setData({
      selectedPhysicsBookId: selectedPhysicsBook.id,
      selectedPhysicsBook,
      physicsChapters: selectedPhysicsBook.chapters,
    });
  },

  openPhysicsChapter(event) {
    wx.navigateTo({
      url: `/pages/physics-chapter/index?id=${event.currentTarget.dataset.id}`,
    });
  },

  openSearch() {
    wx.navigateTo({
      url: `/pages/search/index?subjectId=${this.subjectId}`,
    });
  },

  onImageError(event) {
    const { index } = event.currentTarget.dataset;
    this.setData({ [`topics[${index}].imageLoadFailed`]: true });
  },
});
