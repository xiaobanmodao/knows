const { getSubjectHome, normalizeSubjectId } = require('../../repository');
const { applyTempFileURL, getTempFileURLMap, isCloudFile } = require('../../../../utils/cloud-assets');
const { openContent } = require('../../../../utils/content-routes');
const { openCatalogRoute } = require('../../../../utils/catalog-routes');

Page({
  data: {
    loading: true,
    notFound: '',
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
    activeView: 'catalog',
  },

  async onLoad(options = {}) {
    this.pageActive = true;
    const requestToken = (this.assetRequestToken || 0) + 1;
    this.assetRequestToken = requestToken;
    const subjectId = normalizeSubjectId(options.id);
    this.subjectId = subjectId;
    this.setData({ loading: true, notFound: '' });

    try {
      const home = getSubjectHome(subjectId);
      if (!home || !home.subject) {
        throw new Error('学科内容暂未找到');
      }

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
      const topics = Array.isArray(home.topics) ? home.topics : [];
      wx.setNavigationBarTitle({ title: home.subject.name });
      this.setData({
        subject: { ...home.subject, gradeText: (home.subject.gradeBands || []).join(' · ') },
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
        loading: false,
        notFound: '',
        topics: topics.map((topic) => ({
          ...topic,
          gradeText: (topic.gradeBands || []).join(' / '),
          coverImage: isCloudFile(topic.coverImage) ? '' : topic.coverImage,
          imageLoadFailed: false,
        })),
      });

      const imagePaths = topics.map((topic) => topic.coverImage).filter(Boolean);
      try {
        const fileMap = await getTempFileURLMap(imagePaths);
        if (!this.pageActive || this.assetRequestToken !== requestToken) return;
        this.setData({
          topics: topics.map((topic) => ({
            ...topic,
            gradeText: (topic.gradeBands || []).join(' / '),
            coverImage: applyTempFileURL(topic.coverImage, fileMap) || (isCloudFile(topic.coverImage) ? '' : topic.coverImage),
            imageLoadFailed: false,
          })),
        });
      } catch (error) {
        // 图片地址失败时保留已经展示的文字内容。
      }
    } catch (error) {
      if (!this.pageActive || this.assetRequestToken !== requestToken) return;
      this.setData({
        loading: false,
        subject: null,
        topics: [],
        notFound: '当前学科内容暂未打开，请重试。',
      });
    }
  },

  onUnload() {
    this.pageActive = false;
    this.assetRequestToken = (this.assetRequestToken || 0) + 1;
  },

  reopen() {
    this.onLoad({ id: this.subjectId });
  },

  openTopic(event) {
    const { id } = event.currentTarget.dataset;
    openContent({ subjectId: 'physics', type: 'topic', id });
  },

  selectView(event) {
    const { view } = event.currentTarget.dataset;

    if (view === 'catalog' || view === 'topics') {
      this.setData({ activeView: view });
    }
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
    openContent({ subjectId: 'english', type: 'unit', id: event.currentTarget.dataset.id });
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
    openContent({ subjectId: 'physics', type: 'chapter', id: event.currentTarget.dataset.id });
  },

  openSearch() {
    openCatalogRoute('search', { subjectId: this.subjectId });
  },

  onImageError(event) {
    const { index } = event.currentTarget.dataset;
    this.setData({ [`topics[${index}].imageLoadFailed`]: true });
  },
});
