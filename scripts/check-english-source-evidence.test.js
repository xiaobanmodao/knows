const assert = require('assert');

const {
  DIRECTORY_REVIEW,
  ENGLISH_SOURCE_EVIDENCE,
  checkEnglishSourceEvidence,
  getEnglishSourceEvidence,
} = require('../packages/english/data/english-source-evidence');
const { books } = require('../packages/english/data/english-units');

function cloneReview() {
  return JSON.parse(JSON.stringify(DIRECTORY_REVIEW));
}

assert.strictEqual(DIRECTORY_REVIEW.evidenceKind, 'official-unit-directory');
DIRECTORY_REVIEW.books.forEach((book) => {
  assert.deepStrictEqual(
    Object.keys(book).sort(),
    ['bookId', 'resourceUrl', 'status', 'unitEvidence', 'unverifiedUnitIds'].sort(),
    `英语目录证据册次必须仅含元数据字段：${book.bookId}`,
  );
});
assert.deepStrictEqual(
  DIRECTORY_REVIEW.books.find((book) => book.bookId === 'eng-book-g9a-2025').unverifiedUnitIds,
  [
    'eng-unit-g9a-smart-learning',
    'eng-unit-g9a-our-memory',
    'eng-unit-g9a-power-of-ideas',
    'eng-unit-g9a-beyond-earth',
    'eng-unit-g9a-feel-rhythm',
    'eng-unit-g9a-more-than-game',
  ],
);

assert.strictEqual(checkEnglishSourceEvidence(), true);

const falselyFullyVerifiedBooks = books.map((book) => (book.id === 'eng-book-g9a-2025'
  ? { ...book, sourceNote: '当前人教社公开目录页已核对 Unit 1-2；完整官方目录复核已经完成。' }
  : book));
assert.throws(
  () => checkEnglishSourceEvidence({ localBooks: falselyFullyVerifiedBooks }),
  /Unit 1-2.*等待完整官方目录复核/,
);

const unboundedPartialBooks = books.map((book) => (book.id === 'eng-book-g9a-2025'
  ? { ...book, sourceNote: '其余现有单元保留原创讲解，等待完整官方目录复核。' }
  : book));
assert.throws(
  () => checkEnglishSourceEvidence({ localBooks: unboundedPartialBooks }),
  /Unit 1-2.*等待完整官方目录复核/,
);

assert.strictEqual(ENGLISH_SOURCE_EVIDENCE.length, 6);
assert.strictEqual(ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'verified').length, 4);
assert.strictEqual(ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'partial').length, 1);
assert.strictEqual(ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'pending').length, 1);

const titleDriftReview = cloneReview();
titleDriftReview.books.find((book) => book.bookId === 'eng-book-g8a-2024')
  .unitEvidence.find((unit) => unit.unitId === 'eng-unit-g8a-same-or-different')
  .title = 'Same or Different?';
assert.throws(
  () => checkEnglishSourceEvidence({ review: titleDriftReview }),
  /标题漂移/,
);

const legacyUrlReview = cloneReview();
legacyUrlReview.books.find((book) => book.bookId === 'eng-book-g8a-2024')
  .resourceUrl = 'https://www.pep.com.cn/zslth/yyptypzj/czyy/8s/';
assert.throws(
  () => checkEnglishSourceEvidence({ review: legacyUrlReview }),
  /URL/,
);

const mismatchedBookUrlReview = cloneReview();
mismatchedBookUrlReview.books.find((book) => book.bookId === 'eng-book-g8a-2024')
  .resourceUrl = 'https://www.pep.com.cn/zslth/yyptzy/czyy/8x/';
assert.throws(
  () => checkEnglishSourceEvidence({ review: mismatchedBookUrlReview }),
  /URL/,
);

const incompletePartialReview = cloneReview();
incompletePartialReview.books.find((book) => book.bookId === 'eng-book-g9a-2025')
  .unverifiedUnitIds.pop();
assert.throws(
  () => checkEnglishSourceEvidence({ review: incompletePartialReview }),
  /未核对单元/,
);

const overObservedPartialReview = cloneReview();
const overObservedG9a = overObservedPartialReview.books.find((book) => book.bookId === 'eng-book-g9a-2025');
overObservedG9a.unitEvidence.push({
  unitId: 'eng-unit-g9a-smart-learning',
  number: 3,
  title: 'Smart Learning',
  isStarter: false,
});
overObservedG9a.unverifiedUnitIds.shift();
assert.throws(
  () => checkEnglishSourceEvidence({ review: overObservedPartialReview }),
  /Unit 1-2/,
);

const extraReviewField = cloneReview();
extraReviewField['external-content'] = 'forbidden';
assert.throws(
  () => checkEnglishSourceEvidence({ review: extraReviewField }),
  /字段/,
);

const extraBookField = cloneReview();
extraBookField.books.find((book) => book.bookId === 'eng-book-g8a-2024')
  .textbookBody = 'forbidden';
assert.throws(
  () => checkEnglishSourceEvidence({ review: extraBookField }),
  /字段/,
);

const extraUnitField = cloneReview();
extraUnitField.books.find((book) => book.bookId === 'eng-book-g8a-2024')
  .unitEvidence[0]['external-content'] = 'forbidden';
assert.throws(
  () => checkEnglishSourceEvidence({ review: extraUnitField }),
  /字段/,
);

const dotSegmentUrlReview = cloneReview();
dotSegmentUrlReview.books.find((book) => book.bookId === 'eng-book-g8a-2024')
  .resourceUrl = 'https://www.pep.com.cn/zslth/yyptzy/czyy/./';
assert.throws(
  () => checkEnglishSourceEvidence({ review: dotSegmentUrlReview }),
  /URL/,
);

const numericStarterReview = cloneReview();
numericStarterReview.books.find((book) => book.bookId === 'eng-book-g7a-2024')
  .unitEvidence[0].isStarter = 1;
assert.throws(
  () => checkEnglishSourceEvidence({ review: numericStarterReview }),
  /Starter/,
);

const observedPendingReview = cloneReview();
observedPendingReview.books.find((book) => book.bookId === 'eng-book-g9b-pending')
  .unitEvidence.push({
    unitId: 'eng-unit-g9a-changing-world',
    number: 1,
    title: 'The Changing World',
    isStarter: false,
  });
assert.throws(
  () => checkEnglishSourceEvidence({ review: observedPendingReview }),
  /待核对册次不得包含单元/,
);

assert.strictEqual(getEnglishSourceEvidence('eng-book-g9a-2025').status, 'partial');
assert.strictEqual(getEnglishSourceEvidence('eng-book-g9b-pending').status, 'pending');
assert.strictEqual(getEnglishSourceEvidence('missing-book'), null);

console.log('OK english source evidence contract');
