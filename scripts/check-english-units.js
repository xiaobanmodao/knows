const englishUnits = require('../data/english-units');
const subjects = require('../utils/subjects');

const issues = [];
const ids = new Map();
const exampleOwners = new Map();

function registerId(id, owner) {
  if (!id) {
    issues.push(`${owner}: 缺少稳定 ID`);
  } else if (ids.has(id)) {
    issues.push(`${owner}: ID 与 ${ids.get(id)} 重复 -> ${id}`);
  } else {
    ids.set(id, owner);
  }
}

function requireText(value, owner, field) {
  if (!String(value || '').trim()) issues.push(`${owner}: 缺少 ${field}`);
}

function registerExample(sentence, translation, owner) {
  const normalized = String(sentence || '').trim().toLowerCase();

  if (exampleOwners.has(normalized)) {
    issues.push(`${owner}: 例句与 ${exampleOwners.get(normalized)} 重复`);
  } else {
    exampleOwners.set(normalized, owner);
  }

  if (!/[A-Za-z]/.test(sentence || '')) issues.push(`${owner}: 英文例句缺少英文内容`);
  if (!/[\u3400-\u9fff]/.test(translation || '')) issues.push(`${owner}: 中文翻译缺少中文内容`);
}

if (englishUnits.books.length !== 6 || englishUnits.bookCount !== 5) {
  issues.push('英语教材应包含 5 册已核对内容和 1 册待发布目录');
}

if (englishUnits.unitCount !== 42 || englishUnits.vocabularyCount !== 336 || englishUnits.grammarCount !== 84) {
  issues.push(`规模错误：当前 ${englishUnits.unitCount} 单元、${englishUnits.vocabularyCount} 词、${englishUnits.grammarCount} 语法，应为 42/336/84`);
}

const expectedBooks = {
  'eng-book-g7a-2024': 10,
  'eng-book-g7b-2024': 8,
  'eng-book-g8a-2024': 8,
  'eng-book-g8b-2024': 8,
  'eng-book-g9a-2025': 8,
  'eng-book-g9b-pending': 0,
};

englishUnits.books.forEach((book) => {
  registerId(book.id, book.label);
  if (!(book.id in expectedBooks) || book.unitCount !== expectedBooks[book.id]) {
    issues.push(`${book.label}: 单元数与目录基线不符`);
  }
  if (book.status === 'pending' && book.units.length) {
    issues.push(`${book.label}: 待发布教材不得录入猜测单元`);
  }
});

englishUnits.units.forEach((unit) => {
  const owner = `${unit.bookLabel}/${unit.unitLabel} ${unit.title}`;
  registerId(unit.id, owner);
  ['title', 'theme'].forEach((field) => requireText(unit[field], owner, field));
  ['coverImage', 'figureCaption'].forEach((field) => requireText(unit[field], owner, field));
  if (unit.coverImage !== `/assets/figures/generated/subjects/english/units/${unit.id}.png`) {
    issues.push(`${owner}: 单元图片路径与稳定 ID 不一致`);
  }
  if (unit.vocabulary.length !== 8) issues.push(`${owner}: 应有 8 个核心词`);
  if (unit.grammarPoints.length !== 2) issues.push(`${owner}: 应有 2 个语法点`);
  if (unit.expressions.length < 3) issues.push(`${owner}: 核心表达至少 3 条`);

  unit.vocabulary.forEach((word) => {
    const wordOwner = `${owner}/${word.word}`;
    registerId(word.id, wordOwner);
    ['word', 'partOfSpeech', 'meaning', 'usage', 'forms', 'example', 'translation', 'note']
      .forEach((field) => requireText(word[field], wordOwner, field));
    if (!Array.isArray(word.collocations) || word.collocations.length < 2) {
      issues.push(`${wordOwner}: 固定搭配至少 2 条`);
    }
    registerExample(word.example, word.translation, wordOwner);
  });

  unit.grammarPoints.forEach((point) => {
    const grammarOwner = `${owner}/${point.title}`;
    registerId(point.id, grammarOwner);
    ['title', 'summary'].forEach((field) => requireText(point[field], grammarOwner, field));
    if (!Array.isArray(point.structures) || point.structures.length < 2) issues.push(`${grammarOwner}: 核心结构至少 2 条`);
    if (!Array.isArray(point.examples) || point.examples.length < 2) issues.push(`${grammarOwner}: 原创例句至少 2 条`);
    if (!Array.isArray(point.mistakes) || point.mistakes.length < 2) issues.push(`${grammarOwner}: 易错点至少 2 条`);
    point.examples.forEach((example, index) => {
      ['sentence', 'translation', 'explanation'].forEach((field) => requireText(example[field], `${grammarOwner}/例句${index + 1}`, field));
      registerExample(example.sentence, example.translation, `${grammarOwner}/例句${index + 1}`);
    });
  });
});

[
  ['stomachache', 'word'],
  ['现在完成时', 'grammar'],
  ['used to', 'grammar'],
  ['非限制性定语从句', 'grammar'],
  ['The Changing World', 'unit'],
  ['be harmful to', 'word'],
].forEach(([keyword, type]) => {
  const results = subjects.searchAllSubjects(keyword, 'english');
  if (!results.some((item) => item.type === type)) {
    issues.push(`英语搜索“${keyword}”未命中 ${type}`);
  }
});

if (issues.length) {
  console.log('FOUND_ENGLISH_UNIT_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK ${englishUnits.bookCount} books, ${englishUnits.unitCount} units, ${englishUnits.vocabularyCount} words, ${englishUnits.grammarCount} grammar points, ${exampleOwners.size} unique examples, ${ids.size} unique IDs checked`);
