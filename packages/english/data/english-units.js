const grade7Books = require('./english-units-grade7');
const grade8Books = require('./english-units-grade8');
const grade9Books = require('./english-units-grade9');

const books = [...grade7Books, ...grade8Books, ...grade9Books];
const availableBooks = books.filter((book) => book.status === 'verified');
const units = availableBooks.flatMap((book) => book.units);
const vocabulary = units.flatMap((unit) => unit.vocabulary.map((word) => ({
  ...word,
  unitId: unit.id,
  bookId: unit.bookId,
  unitTitle: unit.title,
  bookLabel: unit.bookLabel,
})));
const grammarPoints = units.flatMap((unit) => unit.grammarPoints.map((point) => ({
  ...point,
  unitId: unit.id,
  bookId: unit.bookId,
  unitTitle: unit.title,
  bookLabel: unit.bookLabel,
})));
const exampleCount = vocabulary.reduce((sum, word) => sum + (word.examples ? word.examples.length : 1), 0)
  + grammarPoints.reduce((sum, point) => sum + point.examples.length, 0);

function getBookById(bookId) {
  return books.find((book) => book.id === bookId) || null;
}

function getUnitById(unitId) {
  return units.find((unit) => unit.id === unitId) || null;
}

module.exports = {
  books,
  availableBooks,
  units,
  vocabulary,
  grammarPoints,
  getBookById,
  getUnitById,
  bookCount: availableBooks.length,
  unitCount: units.length,
  vocabularyCount: vocabulary.length,
  grammarCount: grammarPoints.length,
  exampleCount,
};
