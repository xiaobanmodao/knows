const englishUnits = require('../packages/english/data/english-units');

const issues = [];

function issue(owner, message) {
  issues.push(`${owner}: ${message}`);
}

function getUnit(unitId) {
  return englishUnits.units.find((unit) => unit.id === unitId);
}

function getWord(unitId, headword) {
  const unit = getUnit(unitId);
  const word = unit && unit.vocabulary.find((item) => item.word === headword);
  if (!word) issue(unitId, `缺少待复核词条 ${headword}`);
  return word;
}

function getGrammar(unitId, grammarId) {
  const unit = getUnit(unitId);
  const id = `${unitId}-grammar-${grammarId}`;
  const point = unit && unit.grammarPoints.find((item) => item.id === id);
  if (!point) issue(unitId, `缺少待复核语法点 ${grammarId}`);
  return point;
}

function combinedText(value) {
  return [
    value.title,
    value.summary,
    value.usage,
    value.forms,
    value.note,
    ...(value.structures || []),
    ...(value.collocations || []),
    ...(value.expressions || []),
    ...(value.examples || []).flatMap((example) => [
      example.sentence,
      example.translation,
      example.explanation,
    ]),
  ].filter(Boolean).join(' ');
}

function requireMatch(value, pattern, owner, message) {
  if (!pattern.test(String(value || ''))) issue(owner, message);
}

function rejectMatch(value, pattern, owner, message) {
  if (pattern.test(String(value || ''))) issue(owner, message);
}

englishUnits.books.forEach((book) => {
  if (book.status !== 'verified') return;
  const owner = `${book.label}/来源说明`;
  requireMatch(book.sourceNote, /单元标题和顺序已.*核对/, owner, '应明确“已核对”仅指单元标题和顺序');
  requireMatch(book.sourceNote, /原创整理/, owner, '应声明词汇、语法和例句为项目原创整理');
  requireMatch(book.sourceNote, /不作为教材逐页词表/, owner, '应避免把主题词汇误称为教材逐页词表');
});

englishUnits.units.forEach((unit) => {
  const owner = `${unit.bookLabel}/${unit.unitLabel} ${unit.title}`;

  unit.expressions.forEach((expression, index) => {
    requireMatch(expression, /[.!?]$/, `${owner}/核心表达${index + 1}`, '英文句子应有结束标点');
    rejectMatch(expression, /\b(?:can|could|may|might|must|should|will|would)\s+to\s+[a-z]+/i, `${owner}/核心表达${index + 1}`, '情态动词后不应直接使用 to do');
  });

  unit.vocabulary.forEach((word) => {
    const wordOwner = `${owner}/${word.word}`;
    (word.examples || [{ sentence: word.example }]).forEach((example, index) => {
      const exampleOwner = `${wordOwner}/例句${index + 1}`;
      requireMatch(example.sentence, /[.!?]$/, exampleOwner, '词汇例句应有结束标点');
      rejectMatch(example.sentence, /\b(?:can|could|may|might|must|should|will|would)\s+to\s+[a-z]+/i, exampleOwner, '情态动词后不应直接使用 to do');
    });
  });

  unit.grammarPoints.forEach((point) => {
    const grammarOwner = `${owner}/${point.title}`;
    point.examples.forEach((example, index) => {
      const exampleOwner = `${grammarOwner}/例句${index + 1}`;
      requireMatch(example.sentence, /[.!?]$/, exampleOwner, '英文句子应有结束标点');
      rejectMatch(example.sentence, /\b(?:can|could|may|might|must|should|will|would)\s+to\s+[a-z]+/i, exampleOwner, '情态动词后不应直接使用 to do');
    });

    if (/present-perfect/.test(point.id)) {
      point.examples.forEach((example, index) => {
        rejectMatch(
          example.sentence,
          /\b(?:yesterday|last (?:night|week|month|year)|\d+ (?:day|days|week|weeks|year|years) ago|in (?:19|20)\d{2})\b/i,
          `${grammarOwner}/例句${index + 1}`,
          '现在完成时示例不应搭配明确结束的过去时间',
        );
      });
    }
  });
});

const lexicalFacts = [
  ['eng-unit-g7a-you-and-me', 'information', /不可数.*无复数/],
  ['eng-unit-g7a-day-in-life', 'homework', /不可数.*无复数/],
  ['eng-unit-g8b-stay-healthy', 'advice', /不可数/],
  ['eng-unit-g9a-beyond-earth', 'evidence', /不可数/],
  ['eng-unit-g8a-happy-holiday', 'scenery', /不可数/],
  ['eng-unit-g9a-more-than-game', 'teamwork', /不可数/],
  ['eng-unit-g7a-starter-welcome', 'goose', /复数 geese/],
  ['eng-unit-g7a-were-family', 'child', /复数 children/],
  ['eng-unit-g8a-amazing-plants-animals', 'species', /单复数均为 species/],
  ['eng-unit-g9a-beyond-earth', 'spacecraft', /单复数均为 spacecraft/],
];

lexicalFacts.forEach(([unitId, headword, pattern]) => {
  const word = getWord(unitId, headword);
  if (word) requireMatch(combinedText(word), pattern, `${unitId}/${headword}`, '关键词汇事实与复核基线不一致');
});

const correctedCollocations = [
  ['eng-unit-g7a-were-family', 'parent', 'parent-teacher meeting'],
  ['eng-unit-g7b-animal-friends', 'clever', 'be clever at doing sth'],
  ['eng-unit-g7b-keep-fit', 'exercise', 'get some exercise'],
  ['eng-unit-g8a-home-sweet-home', 'relationship', 'relationship with sb'],
  ['eng-unit-g8a-home-sweet-home', 'organize', 'organize your time'],
  ['eng-unit-g9a-beyond-earth', 'orbit', 'orbit the Earth'],
];

correctedCollocations.forEach(([unitId, headword, collocation]) => {
  const word = getWord(unitId, headword);
  if (word && !word.collocations.includes(collocation)) {
    issue(`${unitId}/${headword}`, `缺少已复核搭配“${collocation}”`);
  }
});

const presentPerfect = getGrammar('eng-unit-g9a-changing-world', 'present-perfect-change');
if (presentPerfect) {
  requireMatch(combinedText(presentPerfect), /since.*起点/, presentPerfect.id, 'since 应说明时间起点');
  requireMatch(combinedText(presentPerfect), /for.*时长|for.*时间段/, presentPerfect.id, 'for 应说明持续时长');
}

const usedTo = getGrammar('eng-unit-g9a-changing-world', 'used-to-contrast');
if (usedTo) {
  const text = combinedText(usedTo);
  requireMatch(text, /used to \+ 动词原形/, usedTo.id, 'used to 应接动词原形');
  requireMatch(text, /be used to \+ 名词\/doing.*get used to \+ 名词\/doing/, usedTo.id, 'be/get used to 中 to 是介词');
}

const sportUnit = getUnit('eng-unit-g9a-more-than-game');
if (sportUnit) {
  sportUnit.expressions.forEach((expression, index) => {
    rejectMatch(expression, /\bif\b.*\bhad\b.*\bwould\b.*\bhave\b/i, `${sportUnit.id}/核心表达${index + 1}`, '本单元语法范围只讲解第一、第二条件句，不应出现未讲解的第三条件句');
  });
}

const correctedExamples = [
  ['eng-unit-g8b-natures-temper', 'earthquake', /took part in an earthquake drill/i],
  ['eng-unit-g8b-natures-temper', 'storm', /warning was issued/i],
  ['eng-unit-g9a-feel-rhythm', 'melody', /becomes softer/i],
];

correctedExamples.forEach(([unitId, headword, pattern]) => {
  const word = getWord(unitId, headword);
  if (word) requireMatch(word.example, pattern, `${unitId}/${headword}`, '例句与已复核的自然表达不一致');
});

const depthFacts = [
  ['eng-unit-g7a-starter-keep-tidy', 'colour', (word) => word.spellingVariants.some((item) => item.value === 'color'), '应记录美式拼写 color'],
  ['eng-unit-g7a-favourite-subject', 'favourite', (word) => word.spellingVariants.some((item) => item.value === 'favorite'), '应记录美式拼写 favorite'],
  ['eng-unit-g7a-you-and-me', 'information', (word) => /不可数/.test(word.senses[0].countability), 'information 应标记为不可数'],
  ['eng-unit-g7a-day-in-life', 'arrive', (word) => /不及物/.test(word.senses[0].transitivity), 'arrive 应标记为不及物'],
  ['eng-unit-g7a-starter-welcome', 'goose', (word) => word.searchTerms.includes('geese'), 'goose 应能通过 geese 检索'],
  ['eng-unit-g7b-here-and-now', 'practise', (word) => word.spellingVariants.some((item) => item.value === 'practice'), 'practise 应记录美式拼写 practice'],
  ['eng-unit-g7b-rain-or-shine', 'weather', (word) => /不可数/.test(word.senses[0].countability), 'weather 应标记为不可数'],
  ['eng-unit-g7b-day-to-remember', 'happen', (word) => /不及物/.test(word.senses[0].transitivity), 'happen 应标记为不及物'],
  ['eng-unit-g7b-day-to-remember', 'experience', (word) => /经验.*不可数/.test(word.senses[0].countability), 'experience 应区分经历与经验的可数性'],
];

depthFacts.forEach(([unitId, headword, predicate, message]) => {
  const word = getWord(unitId, headword);
  if (word && !predicate(word)) issue(`${unitId}/${headword}`, message);
});

if (issues.length) {
  console.log('FOUND_ENGLISH_ACCURACY_ISSUES');
  issues.forEach((item) => console.log(item));
  process.exit(1);
}

console.log(`OK ${englishUnits.bookCount} verified books, ${englishUnits.unitCount} units, ${englishUnits.vocabularyCount} words, ${englishUnits.grammarCount} grammar points checked for language accuracy boundaries`);
