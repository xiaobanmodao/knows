const assert = require('assert');

const { ENGLISH_CURRICULUM_BASELINE } = require('../packages/english/data/english-curriculum-baseline');
const englishUnits = require('../packages/english/data/english-units');

const pendingBook = englishUnits.books.find((book) => book.id === 'eng-book-g9b-pending');
const pendingMapping = ENGLISH_CURRICULUM_BASELINE.pendingMappings.find((item) => item.bookId === pendingBook.id);

assert.strictEqual(ENGLISH_CURRICULUM_BASELINE.schemaVersion, 1);
assert.strictEqual(ENGLISH_CURRICULUM_BASELINE.structure.bookCount, 6);
assert.strictEqual(ENGLISH_CURRICULUM_BASELINE.structure.formalUnitCount, 44);
assert.ok(pendingBook && pendingBook.status === 'pending');
assert.strictEqual(pendingBook.unitCount, 0);
assert.strictEqual(pendingMapping.mappingStatus, 'structure-confirmed-titles-pending');
assert.strictEqual(pendingMapping.officialFormalUnitCount, 5);
assert.strictEqual(pendingMapping.optionalDramaCount, 2);
assert.strictEqual(pendingMapping.officialUnitTitles, null);
assert.ok(pendingMapping.notes.includes('不创建空单元'));
assert.ok(pendingMapping.sourceIds.includes('pep-english-new-textbook-2025'));

console.log('OK English curriculum map contract');
