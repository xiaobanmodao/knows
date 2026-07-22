const english = require('../packages/english/data/english-units');
const {
  REFERENCE_SOURCES,
  BOOK_DEPTH_STATUS,
  wordDepth,
  grammarDepth,
} = require('../packages/english/data/details/index');

const issues = [];
const ids = new Set();
const examples = new Map();
const depthBookSpecs = [
  { id: 'eng-book-g7a-2024', label: '七年级上册', unitCount: 10, wordCount: 80, grammarCount: 20 },
  { id: 'eng-book-g7b-2024', label: '七年级下册', unitCount: 8, wordCount: 64, grammarCount: 16 },
];
const depthBookIds = new Set(depthBookSpecs.map((item) => item.id));
const depthUnits = english.units.filter((unit) => depthBookIds.has(unit.bookId));
const depthWords = depthUnits.flatMap((unit) => unit.vocabulary);
const depthGrammar = depthUnits.flatMap((unit) => unit.grammarPoints);

function issue(owner, message) {
  issues.push(`${owner}: ${message}`);
}

function requireText(value, owner, field) {
  if (!String(value || '').trim()) issue(owner, `缺少 ${field}`);
}

function requireList(value, minimum, owner, field) {
  if (!Array.isArray(value) || value.length < minimum) issue(owner, `${field} 至少 ${minimum} 项`);
}

function registerId(id, owner) {
  if (!id) issue(owner, '缺少稳定 ID');
  else if (ids.has(id)) issue(owner, `稳定 ID 重复 ${id}`);
  else ids.add(id);
}

function registerExample(example, owner) {
  requireText(example && example.sentence, owner, '英文例句');
  requireText(example && example.translation, owner, '中文翻译');
  requireText(example && example.explanation, owner, '例句说明');

  const sentence = String(example && example.sentence || '').trim();
  const key = sentence.toLowerCase();
  if (examples.has(key)) issue(owner, `例句与 ${examples.get(key)} 重复`);
  else examples.set(key, owner);
  if (!/[A-Za-z]/.test(sentence)) issue(owner, '英文例句缺少英文');
  if (!/[.!?]$/.test(sentence)) issue(owner, '英文例句缺少结束标点');
  if (!/[\u3400-\u9fff]/.test(String(example && example.translation || ''))) issue(owner, '翻译缺少中文');
}

function checkReview(review, owner) {
  requireText(review && review.status, owner, '复核状态');
  requireText(review && review.reviewedAt, owner, '复核日期');
  requireList(review && review.sourceKeys, 1, owner, '来源');
  (review && review.sourceKeys || []).forEach((key) => {
    if (!REFERENCE_SOURCES[key]) issue(owner, `来源键无效 ${key}`);
  });
}

depthBookSpecs.forEach((spec) => {
  const units = english.units.filter((unit) => unit.bookId === spec.id);
  const words = units.flatMap((unit) => unit.vocabulary);
  const grammarPoints = units.flatMap((unit) => unit.grammarPoints);

  if (units.length !== spec.unitCount || words.length !== spec.wordCount || grammarPoints.length !== spec.grammarCount) {
    issue(spec.label, `规模应为 ${spec.unitCount} 单元/${spec.wordCount} 词/${spec.grammarCount} 语法，当前 ${units.length}/${words.length}/${grammarPoints.length}`);
  }

  const status = BOOK_DEPTH_STATUS[spec.id];
  if (!status || status.status !== 'complete' || status.wordCount !== spec.wordCount || status.grammarCount !== spec.grammarCount) {
    issue(spec.label, '册次补深状态与内容规模不一致');
  }
});

if (wordDepth.length !== 144 || grammarDepth.length !== 36) {
  issue('补深数据', `应为 144 词/36 语法，当前 ${wordDepth.length}/${grammarDepth.length}`);
}

depthWords.forEach((word) => {
  const owner = `${word.id}/${word.word}`;
  registerId(word.id, owner);
  if (word.detailVersion !== 2 || !word.hasDepth) issue(owner, '未启用补深版本 2');
  requireList(word.phonetics && word.phonetics.uk, 1, owner, 'UK 音标');
  requireList(word.phonetics && word.phonetics.us, 1, owner, 'US 音标');
  [...(word.phonetics && word.phonetics.uk || []), ...(word.phonetics && word.phonetics.us || [])].forEach((ipa) => {
    if (!/^\/.+\/$/.test(ipa)) issue(owner, `IPA 必须使用斜线包裹 ${ipa}`);
  });
  requireList(word.senses, 1, owner, '词义分项');
  word.senses.forEach((sense) => {
    ['partOfSpeech', 'meaning', 'usage'].forEach((field) => requireText(sense[field], owner, field));
    if (/(^|\/)名词($|\/)/.test(sense.partOfSpeech) && !sense.countability) issue(owner, '名词缺少可数性');
    if (/动词/.test(sense.partOfSpeech) && !sense.transitivity) issue(owner, '动词缺少及物性');
  });
  requireList(word.formItems, 1, owner, '词形');
  requireList(word.collocationDetails, 2, owner, '搭配');
  word.collocationDetails.forEach((item) => {
    ['phrase', 'meaning', 'pattern'].forEach((field) => requireText(item[field], owner, `搭配.${field}`));
  });
  requireList(word.examples, 2, owner, '原创例句');
  word.examples.forEach((example, index) => registerExample(example, `${owner}/例句${index + 1}`));
  requireList(word.distinctions, 1, owner, '易混辨析');
  word.distinctions.forEach((item) => {
    requireText(item.target, owner, '辨析对象');
    requireText(item.guidance, owner, '辨析说明');
  });
  checkReview(word.review, owner);
});

depthGrammar.forEach((point) => {
  const owner = `${point.id}/${point.title}`;
  registerId(point.id, owner);
  if (point.detailVersion !== 2 || !point.hasDepth) issue(owner, '未启用补深版本 2');
  requireList(point.conditions, 2, owner, '使用条件');
  requireList(point.variants, 3, owner, '结构变式');
  point.variants.forEach((item) => {
    ['label', 'structure', 'usage'].forEach((field) => requireText(item[field], owner, `变式.${field}`));
  });
  requireList(point.contrasts, 1, owner, '易混对比');
  point.contrasts.forEach((item) => {
    requireText(item.target, owner, '对比对象');
    requireText(item.difference, owner, '对比说明');
    requireList(item.examples, 2, owner, '对比例句');
  });
  if (!point.visual || !['timeline', 'sentence-map', 'comparison'].includes(point.visual.type)) {
    issue(owner, '语法图类型无效');
  }
  requireText(point.visual && point.visual.title, owner, '语法图标题');
  requireList(point.visual && point.visual.items, 3, owner, '语法图节点');
  requireList(point.examples, 3, owner, '原创例句');
  point.examples.forEach((example, index) => registerExample(example, `${owner}/例句${index + 1}`));
  checkReview(point.review, owner);
});

const wordExampleCount = english.vocabulary.reduce((sum, word) => sum + (word.examples ? word.examples.length : 1), 0);
const grammarExampleCount = english.grammarPoints.reduce((sum, point) => sum + point.examples.length, 0);
if (wordExampleCount + grammarExampleCount !== 684) {
  issue('英语例句', `七年级上下册补深后应为 684，当前 ${wordExampleCount + grammarExampleCount}`);
}

function findWord(unitId, headword) {
  return english.vocabulary.find((item) => item.unitId === unitId && item.word === headword);
}

const factChecks = [
  ['colour 美式拼写', findWord('eng-unit-g7a-starter-keep-tidy', 'colour').spellingVariants.some((item) => item.value === 'color')],
  ['favourite 美式拼写', findWord('eng-unit-g7a-favourite-subject', 'favourite').spellingVariants.some((item) => item.value === 'favorite')],
  ['information 不可数', /不可数/.test(findWord('eng-unit-g7a-you-and-me', 'information').senses[0].countability)],
  ['arrive 不及物', /不及物/.test(findWord('eng-unit-g7a-day-in-life', 'arrive').senses[0].transitivity)],
  ['goose 包含 geese', findWord('eng-unit-g7a-starter-welcome', 'goose').searchTerms.includes('geese')],
  ['practise 美式拼写', findWord('eng-unit-g7b-here-and-now', 'practise').spellingVariants.some((item) => item.value === 'practice')],
  ['weather 不可数', /不可数/.test(findWord('eng-unit-g7b-rain-or-shine', 'weather').senses[0].countability)],
  ['happen 不及物', /不及物/.test(findWord('eng-unit-g7b-day-to-remember', 'happen').senses[0].transitivity)],
  ['experience 双重可数性', /可数/.test(findWord('eng-unit-g7b-day-to-remember', 'experience').senses[0].countability)],
];
factChecks.forEach(([label, passed]) => {
  if (!passed) issue('重点事实', label);
});

if (issues.length) {
  console.log('FOUND_ENGLISH_DEPTH_ISSUES');
  issues.forEach((item) => console.log(item));
  process.exit(1);
}

console.log(`OK ${depthUnits.length} units, ${depthWords.length} detailed words, ${depthGrammar.length} detailed grammar points and 684 examples checked`);
