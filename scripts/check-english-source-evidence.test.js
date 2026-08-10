const assert = require('assert');

const {
  ENGLISH_SOURCE_EVIDENCE,
  checkEnglishSourceEvidence,
  getEnglishSourceEvidence,
} = require('../packages/english/data/english-source-evidence');

assert.strictEqual(checkEnglishSourceEvidence(), true);
assert.strictEqual(ENGLISH_SOURCE_EVIDENCE.length, 6);

const verified = ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'verified');
const pending = ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'pending');

assert.strictEqual(verified.length, 5);
assert.strictEqual(pending.length, 1);
assert.deepStrictEqual(
  ENGLISH_SOURCE_EVIDENCE.map((item) => item.bookId),
  [
    'eng-book-g7a-2024',
    'eng-book-g7b-2024',
    'eng-book-g8a-2024',
    'eng-book-g8b-2024',
    'eng-book-g9a-2025',
    'eng-book-g9b-pending',
  ],
);

verified.forEach((item) => {
  assert.strictEqual(item.sourceKey, 'pep-english-digital-resources-2025');
  assert.match(item.resourceUrl, /^https:\/\/www\.pep\.com\.cn\/zslth\/yyptzy\/czyy\//);
  assert.ok(item.unitEvidence.length > 0);
  assert.strictEqual(item.unitCount, item.unitEvidence.length);
  assert.ok(item.unitEvidence.every((unit) => unit.unitId && unit.title));
});

assert.strictEqual(pending[0].bookId, 'eng-book-g9b-pending');
assert.strictEqual(pending[0].resourceUrl, 'https://www.pep.com.cn/zslth/yyptzy/');
assert.deepStrictEqual(pending[0].unitEvidence, []);
assert.strictEqual(pending[0].unitCount, 0);
assert.match(pending[0].note, /不创建|不猜测/);

assert.deepStrictEqual(getEnglishSourceEvidence('eng-book-g8a-2024'), verified[2]);
assert.strictEqual(getEnglishSourceEvidence('eng-book-g9b-pending').status, 'pending');
assert.strictEqual(getEnglishSourceEvidence('missing-book'), null);

console.log('OK english source evidence contract');
