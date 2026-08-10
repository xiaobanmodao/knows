const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const english = require('../packages/english/data/english-units');
const physics = require('../packages/physics/data/physics-curriculum');
const { collectPhysicsFormulaContractIssues } = require('./physics-formula-contract');

const ENGLISH_HIGH_RISK_BATCHES = Object.freeze([
  Object.freeze({ id: 'english-g7a-depth-v1.11', bookId: 'eng-book-g7a-2024', label: '七年级上册', units: 10, words: 80, grammar: 20 }),
  Object.freeze({ id: 'english-g7b-depth-v1.11', bookId: 'eng-book-g7b-2024', label: '七年级下册', units: 8, words: 64, grammar: 16 }),
  Object.freeze({ id: 'english-g8a-depth-v1.11', bookId: 'eng-book-g8a-2024', label: '八年级上册', units: 8, words: 64, grammar: 16 }),
  Object.freeze({ id: 'english-g8b-depth-v1.11', bookId: 'eng-book-g8b-2024', label: '八年级下册', units: 8, words: 64, grammar: 16 }),
  Object.freeze({ id: 'english-g9a-depth-v1.11', bookId: 'eng-book-g9a-2025', label: '九年级上册', units: 8, words: 64, grammar: 16 }),
]);

const PHYSICS_HIGH_RISK_BATCHES = Object.freeze([
  Object.freeze({ id: 'physics-g8a-high-risk-v1.11', bookId: 'phy-book-g8a', label: '八年级上册', chapters: 6, knowledge: 26, experiments: 10, templates: 6 }),
  Object.freeze({ id: 'physics-g8b-high-risk-v1.11', bookId: 'phy-book-g8b', label: '八年级下册', chapters: 6, knowledge: 20, experiments: 9, templates: 6 }),
  Object.freeze({ id: 'physics-g9-high-risk-v1.11', bookId: 'phy-book-g9', label: '九年级全一册', chapters: 10, knowledge: 38, experiments: 10, templates: 10 }),
]);

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function requireText(owner, value, field) {
  assert.ok(typeof value === 'string' && value.trim(), `${owner}: 缺少 ${field}`);
}

function requireList(owner, value, minimum, field) {
  assert.ok(Array.isArray(value) && value.length >= minimum, `${owner}: ${field} 至少 ${minimum} 项`);
}

function countReview(records) {
  return records.reduce((counts, record) => ({
    ...counts,
    [record.review.status]: counts[record.review.status] + 1,
  }), { verified: 0, reviewed: 0, untracked: 0 });
}

function validateEnglishBatch(batch, englishData = english) {
  const units = englishData.units.filter((unit) => unit.bookId === batch.bookId);
  const words = units.flatMap((unit) => unit.vocabulary);
  const grammar = units.flatMap((unit) => unit.grammarPoints);
  assert.strictEqual(units.length, batch.units, `${batch.id}: 单元数量不符`);
  assert.strictEqual(words.length, batch.words, `${batch.id}: 词条数量不符`);
  assert.strictEqual(grammar.length, batch.grammar, `${batch.id}: 语法数量不符`);

  words.forEach((word) => {
    const owner = `${batch.id}/${word.id}`;
    assert.strictEqual(word.detailVersion, 2, `${owner}: detailVersion 无效`);
    assert.strictEqual(word.hasDepth, true, `${owner}: 补深状态无效`);
    requireList(owner, word.phonetics && word.phonetics.uk, 1, 'UK 音标');
    requireList(owner, word.phonetics && word.phonetics.us, 1, 'US 音标');
    requireList(owner, word.senses, 1, '词义');
    requireList(owner, word.collocationDetails, 2, '搭配');
    requireList(owner, word.examples, 2, '例句');
    requireList(owner, word.distinctions, 1, '辨析');
    assert.strictEqual(word.review.status, 'verified', `${owner}: 复核状态无效`);
    requireText(owner, word.review.reviewedAt, '复核日期');
  });

  grammar.forEach((point) => {
    const owner = `${batch.id}/${point.id}`;
    assert.strictEqual(point.detailVersion, 2, `${owner}: detailVersion 无效`);
    assert.strictEqual(point.hasDepth, true, `${owner}: 补深状态无效`);
    requireList(owner, point.conditions, 2, '使用条件');
    requireList(owner, point.variants, 3, '结构变式');
    requireList(owner, point.contrasts, 1, '易混对比');
    requireList(owner, point.examples, 3, '例句');
    assert.ok(point.visual && point.visual.type, `${owner}: 语法图缺失`);
    assert.strictEqual(point.review.status, 'verified', `${owner}: 复核状态无效`);
    requireText(owner, point.review.reviewedAt, '复核日期');
  });

  return {
    id: batch.id,
    subjectId: 'english',
    label: batch.label,
    status: 'passed',
    counts: {
      units: units.length,
      words: words.length,
      grammar: grammar.length,
      wordExamples: words.reduce((sum, word) => sum + word.examples.length, 0),
      grammarExamples: grammar.reduce((sum, point) => sum + point.examples.length, 0),
    },
    review: countReview([...words, ...grammar]),
  };
}

function validatePhysicsBatch(batch, physicsData = physics) {
  const book = physicsData.books.find((item) => item.id === batch.bookId);
  assert.ok(book, `${batch.id}: 物理册次不存在`);
  const chapters = book.chapters;
  const knowledge = chapters.flatMap((chapter) => chapter.knowledgeItems);
  const templates = chapters.flatMap((chapter) => chapter.templates);
  const experiments = knowledge.flatMap((item) => item.sections.filter((section) => section.type === 'experiment'));
  assert.strictEqual(chapters.length, batch.chapters, `${batch.id}: 章节数量不符`);
  assert.strictEqual(knowledge.length, batch.knowledge, `${batch.id}: 知识点数量不符`);
  assert.strictEqual(experiments.length, batch.experiments, `${batch.id}: 实验数量不符`);
  assert.strictEqual(templates.length, batch.templates, `${batch.id}: 方法模板数量不符`);

  const formulaIssues = collectPhysicsFormulaContractIssues(knowledge);
  assert.deepStrictEqual(formulaIssues, [], `${batch.id}: 公式契约不通过`);
  knowledge.forEach((item) => {
    const owner = `${batch.id}/${item.id}`;
    assert.ok(item.physicsDetail, `${owner}: 物理详情缺失`);
    assert.strictEqual(item.physicsDetail.review.status, 'verified', `${owner}: 复核状态无效`);
    requireList(owner, item.physicsDetail.quantities, 0, '物理量');
    const formula = item.sections.find((section) => section.type === 'formula');
    assert.ok(formula, `${owner}: 公式区块缺失`);
    requireText(owner, formula.unitNote, '单位说明');
  });
  experiments.forEach((experiment, index) => {
    const owner = `${batch.id}/experiment-${index + 1}`;
    ['goal', 'phenomenon', 'conclusion', 'safety'].forEach((field) => requireText(owner, experiment[field], field));
    requireList(owner, experiment.steps, 3, '步骤');
    requireList(owner, experiment.errors, 2, '误差');
  });

  return {
    id: batch.id,
    subjectId: 'physics',
    label: batch.label,
    status: 'passed',
    counts: {
      chapters: chapters.length,
      knowledge: knowledge.length,
      experiments: experiments.length,
      templates: templates.length,
      quantityLinks: knowledge.reduce((sum, item) => sum + item.physicsDetail.quantities.length, 0),
      directionRules: knowledge.reduce((sum, item) => sum + item.physicsDetail.directionRules.length, 0),
    },
    review: countReview(knowledge.map((item) => item.physicsDetail)),
  };
}

function buildHighRiskBatchReport({ englishData = english, physicsData = physics } = {}) {
  const englishResults = ENGLISH_HIGH_RISK_BATCHES.map((batch) => validateEnglishBatch(batch, englishData));
  const physicsResults = PHYSICS_HIGH_RISK_BATCHES.map((batch) => validatePhysicsBatch(batch, physicsData));
  const reportInput = {
    english: englishData.books.filter((book) => book.status === 'verified'),
    englishUnits: englishData.units,
    physics: physicsData.books,
  };
  return {
    schemaVersion: 1,
    sourceHash: hash(reportInput),
    batches: [...englishResults, ...physicsResults],
    totals: {
      english: englishResults.reduce((total, result) => ({
        books: total.books + 1,
        units: total.units + result.counts.units,
        words: total.words + result.counts.words,
        grammar: total.grammar + result.counts.grammar,
        wordExamples: total.wordExamples + result.counts.wordExamples,
        grammarExamples: total.grammarExamples + result.counts.grammarExamples,
      }), { books: 0, units: 0, words: 0, grammar: 0, wordExamples: 0, grammarExamples: 0 }),
      physics: physicsResults.reduce((total, result) => ({
        books: total.books + 1,
        chapters: total.chapters + result.counts.chapters,
        knowledge: total.knowledge + result.counts.knowledge,
        experiments: total.experiments + result.counts.experiments,
        templates: total.templates + result.counts.templates,
        quantityLinks: total.quantityLinks + result.counts.quantityLinks,
        directionRules: total.directionRules + result.counts.directionRules,
      }), { books: 0, chapters: 0, knowledge: 0, experiments: 0, templates: 0, quantityLinks: 0, directionRules: 0 }),
    },
  };
}

function writeReport(report, outputPath) {
  const absolutePath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return absolutePath;
}

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const report = buildHighRiskBatchReport();
  const outputPath = getOption('--report');
  if (outputPath) console.log(`Report: ${writeReport(report, outputPath)}`);
  report.batches.forEach((batch) => console.log(`OK high-risk batch ${batch.id}: ${JSON.stringify(batch.counts)}`));
  console.log(`OK subject high-risk batches: ${report.batches.length} batches, source ${report.sourceHash}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FOUND_SUBJECT_HIGH_RISK_BATCH_ISSUES\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  ENGLISH_HIGH_RISK_BATCHES,
  PHYSICS_HIGH_RISK_BATCHES,
  buildHighRiskBatchReport,
  validateEnglishBatch,
  validatePhysicsBatch,
};
