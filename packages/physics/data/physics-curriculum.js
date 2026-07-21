const grade8Upper = require('./physics-curriculum-grade8-upper');
const grade8Lower = require('./physics-curriculum-grade8-lower');
const grade9 = require('./physics-curriculum-grade9');

const books = [grade8Upper, grade8Lower, grade9];
const chapters = books.flatMap((book) => book.chapters);
const knowledgeItems = chapters.flatMap((chapter) => chapter.knowledgeItems);
const templates = chapters.flatMap((chapter) => chapter.templates);

function getBookById(bookId) {
  return books.find((book) => book.id === bookId) || null;
}

function getChapterById(chapterId) {
  return chapters.find((chapter) => chapter.id === chapterId) || null;
}

function getKnowledgeById(knowledgeId) {
  return knowledgeItems.find((item) => item.id === knowledgeId) || null;
}

function getTemplateById(templateId) {
  return templates.find((item) => item.id === templateId) || null;
}

module.exports = {
  books,
  chapters,
  knowledgeItems,
  templates,
  bookCount: books.length,
  chapterCount: chapters.length,
  knowledgeCount: knowledgeItems.length,
  templateCount: templates.length,
  exampleCount: knowledgeItems.reduce((sum, item) => sum + item.problems.length, 0),
  getBookById,
  getChapterById,
  getKnowledgeById,
  getTemplateById,
};
