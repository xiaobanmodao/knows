const { getContentSource } = require('../../../data/content-source-registry');
const { books } = require('./english-units');

const EVIDENCE_SOURCE_KEY = 'pep-english-digital-resources-2025';
const DIGITAL_RESOURCES_INDEX_URL = 'https://www.pep.com.cn/zslth/yyptzy/';
const REVIEWED_AT = '2026-08-10';

const VERIFIED_BOOK_PAGES = Object.freeze({
  'eng-book-g7a-2024': 'https://www.pep.com.cn/zslth/yyptzy/czyy/7s/',
  'eng-book-g7b-2024': 'https://www.pep.com.cn/zslth/yyptzy/czyy/7x/',
  'eng-book-g8a-2024': 'https://www.pep.com.cn/zslth/yyptzy/czyy/8s/',
  'eng-book-g8b-2024': 'https://www.pep.com.cn/zslth/yyptzy/czyy/8x/',
  'eng-book-g9a-2025': 'https://www.pep.com.cn/zslth/yyptzy/czyy/9s/',
});

function getBook(bookId) {
  return books.find((book) => book.id === bookId) || null;
}

function buildUnitEvidence(book) {
  return book.units.map((unit) => ({
    unitId: unit.id,
    number: unit.number,
    title: unit.title,
    isStarter: Boolean(unit.isStarter),
  }));
}

const ENGLISH_SOURCE_EVIDENCE = Object.freeze([
  ...Object.keys(VERIFIED_BOOK_PAGES).map((bookId) => {
    const book = getBook(bookId);
    return Object.freeze({
      bookId,
      status: 'verified',
      sourceKey: EVIDENCE_SOURCE_KEY,
      resourceUrl: VERIFIED_BOOK_PAGES[bookId],
      unitCount: book.units.length,
      unitEvidence: buildUnitEvidence(book),
      reviewedAt: REVIEWED_AT,
      scope: '官方数字配套资源页中的册次与单元范围',
      note: '只记录官方页面定位和本地稳定 ID 对照，不复制教材正文、音频、题目或插图。',
    });
  }),
  Object.freeze({
    bookId: 'eng-book-g9b-pending',
    status: 'pending',
    sourceKey: EVIDENCE_SOURCE_KEY,
    resourceUrl: DIGITAL_RESOURCES_INDEX_URL,
    unitCount: 0,
    unitEvidence: [],
    reviewedAt: REVIEWED_AT,
    scope: '官方公开资源入口待补充',
    note: '官方公开配套资源入口暂未提供九下具体单元标题；核对完成前不创建空单元、不猜测标题。',
  }),
]);

function checkHttpsPepUrl(url) {
  const parsed = new URL(url);
  return parsed.protocol === 'https:' && parsed.hostname === 'www.pep.com.cn';
}

function checkEnglishSourceEvidence() {
  const source = getContentSource(EVIDENCE_SOURCE_KEY);
  if (!source || source.kind !== 'official') {
    throw new Error(`英语教材证据来源未登记为官方来源：${EVIDENCE_SOURCE_KEY}`);
  }
  if (source.url !== DIGITAL_RESOURCES_INDEX_URL) {
    throw new Error('英语教材证据来源入口与注册表不一致');
  }

  const expectedBookIds = books.map((book) => book.id);
  const evidenceBookIds = ENGLISH_SOURCE_EVIDENCE.map((item) => item.bookId);
  if (new Set(evidenceBookIds).size !== evidenceBookIds.length) {
    throw new Error('英语教材证据册次 ID 不得重复');
  }
  if (JSON.stringify(expectedBookIds) !== JSON.stringify(evidenceBookIds)) {
    throw new Error('英语教材证据册次必须覆盖本地全部稳定册次 ID');
  }

  ENGLISH_SOURCE_EVIDENCE.forEach((item) => {
    const book = getBook(item.bookId);
    if (!book || item.sourceKey !== EVIDENCE_SOURCE_KEY || item.reviewedAt !== REVIEWED_AT) {
      throw new Error(`英语教材证据基础字段无效：${item.bookId}`);
    }
    if (!checkHttpsPepUrl(item.resourceUrl)) {
      throw new Error(`英语教材证据 URL 必须使用人教社 HTTPS 页面：${item.bookId}`);
    }
    if (!Array.isArray(item.unitEvidence) || item.unitCount !== item.unitEvidence.length) {
      throw new Error(`英语教材证据单元统计无效：${item.bookId}`);
    }

    if (item.status === 'pending') {
      if (book.status !== 'pending' || book.units.length !== 0 || item.resourceUrl !== DIGITAL_RESOURCES_INDEX_URL) {
        throw new Error(`英语待核对册次不得包含猜测单元：${item.bookId}`);
      }
      return;
    }

    if (item.status !== 'verified' || book.status !== 'verified') {
      throw new Error(`英语已核对册次状态无效：${item.bookId}`);
    }
    if (item.resourceUrl !== VERIFIED_BOOK_PAGES[item.bookId]) {
      throw new Error(`英语已核对册次资源页不在登记映射中：${item.bookId}`);
    }
    if (book.units.length !== item.unitEvidence.length) {
      throw new Error(`英语教材证据单元数量与本地内容不一致：${item.bookId}`);
    }
    item.unitEvidence.forEach((evidenceUnit, index) => {
      const localUnit = book.units[index];
      if (!localUnit || evidenceUnit.unitId !== localUnit.id || evidenceUnit.title !== localUnit.title) {
        throw new Error(`英语教材证据单元稳定 ID 或标题漂移：${item.bookId}/${evidenceUnit.unitId}`);
      }
      if (evidenceUnit.number !== localUnit.number || Boolean(evidenceUnit.isStarter) !== Boolean(localUnit.isStarter)) {
        throw new Error(`英语教材证据单元顺序或 Starter 标记漂移：${item.bookId}/${evidenceUnit.unitId}`);
      }
    });
  });
  return true;
}

function getEnglishSourceEvidence(bookId) {
  return ENGLISH_SOURCE_EVIDENCE.find((item) => item.bookId === bookId) || null;
}

module.exports = {
  DIGITAL_RESOURCES_INDEX_URL,
  ENGLISH_SOURCE_EVIDENCE,
  EVIDENCE_SOURCE_KEY,
  checkEnglishSourceEvidence,
  getEnglishSourceEvidence,
};
