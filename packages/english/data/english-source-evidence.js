const { getContentSource } = require('../../../data/content-source-registry');
const { books } = require('./english-units');
const DIRECTORY_REVIEW = require('../../../docs/evidence/english-unit-directory-review-2026.json');

const EVIDENCE_SOURCE_KEY = 'pep-english-digital-resources-2025';
const DIGITAL_RESOURCES_INDEX_URL = 'https://www.pep.com.cn/zslth/yyptzy/';
const REVIEW_ID = 'english-unit-directory-review-2026';
const REVIEWED_AT = '2026-08-10';
const REVIEW_SCOPE = Object.freeze({
  supports: ['册次', '单元标题', '单元顺序', 'Starter 标记'],
  notVerified: ['教材正文', '音频', '题目', '词表', '图片', '项目知识讲解', '外部内容导入'],
});
const REVIEW_FIELDS = Object.freeze([
  'books',
  'evidenceKind',
  'indexUrl',
  'reviewId',
  'reviewedAt',
  'schemaVersion',
  'scope',
  'sourceKey',
]);
const REVIEW_SCOPE_FIELDS = Object.freeze(['notVerified', 'supports']);
const BOOK_FIELDS = Object.freeze(['bookId', 'resourceUrl', 'status', 'unitEvidence', 'unverifiedUnitIds']);
const G9A_PARTIAL_BOOK_ID = 'eng-book-g9a-2025';
const G9A_OBSERVED_UNIT_IDS = Object.freeze([
  'eng-unit-g9a-changing-world',
  'eng-unit-g9a-inspiring-people',
]);
const UNIT_EVIDENCE_FIELDS = Object.freeze(['isStarter', 'number', 'title', 'unitId']);

const ENGLISH_SOURCE_EVIDENCE = Object.freeze(DIRECTORY_REVIEW.books.map((item) => Object.freeze({
  ...item,
  unitCount: item.unitEvidence.length,
})));

function requireExactArray(actual, expected, message) {
  if (!Array.isArray(actual) || actual.length !== expected.length || actual.some((item, index) => item !== expected[index])) {
    throw new Error(message);
  }
}

function requireExactFields(value, expectedFields, message) {
  const actualFields = Object.keys(value || {}).sort();
  const expected = [...expectedFields].sort();
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || actualFields.length !== expected.length
    || actualFields.some((field, index) => field !== expected[index])) {
    throw new Error(message);
  }
}

function requireExactUnitEvidence(actual, expected, message) {
  if (!Array.isArray(actual) || actual.length !== expected.length) {
    throw new Error(`${message}：单元数量不一致`);
  }
  actual.forEach((item, index) => {
    requireExactFields(item, UNIT_EVIDENCE_FIELDS, `英语教材证据单元字段无效：${item && item.unitId}`);
    if (item.unitId !== expected[index].unitId || item.title !== expected[index].title) {
      throw new Error(message);
    }
    if (item.number !== expected[index].number) {
      throw new Error(`英语教材证据单元顺序漂移：${item.unitId}`);
    }
    if (item.isStarter !== expected[index].isStarter) {
      throw new Error(`英语教材证据单元 Starter 标记漂移：${item.unitId}`);
    }
  });
}

function getDirectoryUrlKind(url) {
  if (typeof url !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    return null;
  }
  if (parsed.href !== url || parsed.protocol !== 'https:' || parsed.hostname !== 'www.pep.com.cn'
    || parsed.port || parsed.username || parsed.password || parsed.search || parsed.hash) {
    return null;
  }
  if (parsed.pathname === '/zslth/yyptzy/') return 'index';
  const bookPagePrefix = '/zslth/yyptzy/czyy/';
  if (!parsed.pathname.startsWith(bookPagePrefix)) return null;
  const childPath = parsed.pathname.slice(bookPagePrefix.length);
  if (!/^[^/]+\/$/.test(childPath)) return null;
  const child = childPath.slice(0, -1);
  let decodedChild;
  try {
    decodedChild = decodeURIComponent(child);
  } catch (error) {
    return null;
  }
  if (!decodedChild || decodedChild === '.' || decodedChild === '..' || /[\\/]/.test(decodedChild)) {
    return null;
  }
  return 'book';
}

function localUnitEvidence(book) {
  return book.units.map((unit) => ({
    unitId: unit.id,
    number: unit.number,
    title: unit.title,
    isStarter: Boolean(unit.isStarter),
  }));
}

function validateReviewEnvelope(review, getSource) {
  requireExactFields(review, REVIEW_FIELDS, '英语官方目录复核记录字段无效');
  if (!review || review.schemaVersion !== 1 || review.reviewId !== REVIEW_ID || review.reviewedAt !== REVIEWED_AT
    || review.evidenceKind !== 'official-unit-directory' || review.sourceKey !== EVIDENCE_SOURCE_KEY
    || review.indexUrl !== DIGITAL_RESOURCES_INDEX_URL) {
    throw new Error('英语官方目录复核记录信封字段无效');
  }
  requireExactFields(review.scope, REVIEW_SCOPE_FIELDS, '英语官方目录复核范围字段无效');
  requireExactArray(review.scope && review.scope.supports, REVIEW_SCOPE.supports, '英语官方目录复核支持范围无效');
  requireExactArray(review.scope && review.scope.notVerified, REVIEW_SCOPE.notVerified, '英语官方目录复核未验证范围无效');

  const source = getSource(EVIDENCE_SOURCE_KEY);
  if (!source || source.kind !== 'official' || source.url !== DIGITAL_RESOURCES_INDEX_URL) {
    throw new Error(`英语教材证据来源未登记为官方来源：${EVIDENCE_SOURCE_KEY}`);
  }
}

function validateBookCoverage(reviewBooks, localBooks) {
  if (!Array.isArray(reviewBooks) || !Array.isArray(localBooks)) {
    throw new Error('英语官方目录册次记录必须为数组');
  }
  const reviewBookIds = reviewBooks.map((book) => book && book.bookId);
  const localBookIds = localBooks.map((book) => book.id);
  if (new Set(reviewBookIds).size !== reviewBookIds.length) {
    throw new Error('英语教材证据册次 ID 不得重复');
  }
  requireExactArray(reviewBookIds, localBookIds, '英语教材证据册次必须覆盖本地全部稳定册次 ID 且保持顺序');
}

function validateBookRecords(reviewBooks, localBooks) {
  reviewBooks.forEach((record, index) => {
    const book = localBooks[index];
    const allowedFields = record && record.bookId === G9A_PARTIAL_BOOK_ID && record.status === 'partial'
      ? [...BOOK_FIELDS, 'sourceNote']
      : BOOK_FIELDS;
    requireExactFields(record, allowedFields, `英语教材证据册次字段无效：${record && record.bookId}`);
    const urlKind = getDirectoryUrlKind(record.resourceUrl);
    if (!record || !book || !urlKind) {
      throw new Error(`英语教材证据 URL 无效：${record && record.bookId}`);
    }
    if (!Array.isArray(record.unitEvidence) || !Array.isArray(record.unverifiedUnitIds)) {
      throw new Error(`英语教材证据单元记录无效：${record.bookId}`);
    }

    const localUnits = localUnitEvidence(book);
    if (record.status === 'verified') {
      if (book.status !== 'verified' || urlKind !== 'book' || record.unverifiedUnitIds.length !== 0) {
        throw new Error(`英语已核对册次状态无效：${record.bookId}`);
      }
      requireExactUnitEvidence(record.unitEvidence, localUnits, `英语教材证据单元稳定 ID 或标题漂移：${record.bookId}`);
      return;
    }

    if (record.status === 'partial') {
      if (book.status !== 'verified' || urlKind !== 'book') {
        throw new Error(`英语部分目录证据册次状态无效：${record.bookId}`);
      }
      if (record.bookId === G9A_PARTIAL_BOOK_ID) {
        requireExactArray(
          record.unitEvidence.map((unit) => unit.unitId),
          G9A_OBSERVED_UNIT_IDS,
          '英语九年级上册部分目录证据必须固定为 Unit 1-2',
        );
      }
      requireExactUnitEvidence(
        record.unitEvidence,
        localUnits.slice(0, record.unitEvidence.length),
        `英语部分目录证据单元稳定 ID 或标题漂移：${record.bookId}`,
      );
      requireExactArray(
        record.unverifiedUnitIds,
        localUnits.slice(record.unitEvidence.length).map((unit) => unit.unitId),
        `英语部分目录证据未核对单元不完整：${record.bookId}`,
      );
      if (record.bookId === G9A_PARTIAL_BOOK_ID
        && (!/公开目录页已核对 Unit 1-2/.test(record.sourceNote || '')
          || !/等待完整官方目录复核/.test(record.sourceNote || ''))) {
        throw new Error('英语九年级上册部分目录证据必须说明 Unit 1-2 已核对且其余等待完整官方目录复核');
      }
      return;
    }

    if (record.status === 'pending') {
      if (book.status !== 'pending' || urlKind !== 'index' || book.units.length !== 0
        || record.unitEvidence.length !== 0 || record.unverifiedUnitIds.length !== 0) {
        throw new Error(`英语待核对册次不得包含单元：${record.bookId}`);
      }
      return;
    }

    throw new Error(`英语教材证据状态无效：${record.bookId}`);
  });
}

function checkEnglishSourceEvidence({
  review = DIRECTORY_REVIEW,
  localBooks = books,
  getSource = getContentSource,
} = {}) {
  validateReviewEnvelope(review, getSource);
  validateBookCoverage(review.books, localBooks);
  validateBookRecords(review.books, localBooks);
  return true;
}

function getEnglishSourceEvidence(bookId) {
  return ENGLISH_SOURCE_EVIDENCE.find((item) => item.bookId === bookId) || null;
}

module.exports = {
  DIGITAL_RESOURCES_INDEX_URL,
  DIRECTORY_REVIEW,
  ENGLISH_SOURCE_EVIDENCE,
  EVIDENCE_SOURCE_KEY,
  checkEnglishSourceEvidence,
  getEnglishSourceEvidence,
};
