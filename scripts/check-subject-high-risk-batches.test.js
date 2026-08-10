const assert = require('assert');

const english = require('../packages/english/data/english-units');
const physics = require('../packages/physics/data/physics-curriculum');
const {
  ENGLISH_HIGH_RISK_BATCHES,
  PHYSICS_HIGH_RISK_BATCHES,
  buildHighRiskBatchReport,
  validateEnglishBatch,
  validatePhysicsBatch,
} = require('./check-subject-high-risk-batches');

const report = buildHighRiskBatchReport({ englishData: english, physicsData: physics });
assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.batches.length, 8);
assert.strictEqual(ENGLISH_HIGH_RISK_BATCHES.length, 5);
assert.strictEqual(PHYSICS_HIGH_RISK_BATCHES.length, 3);
assert.match(report.sourceHash, /^[a-f0-9]{64}$/);
assert.deepStrictEqual(report.totals.english, {
  books: 5,
  units: 42,
  words: 336,
  grammar: 84,
  wordExamples: 672,
  grammarExamples: 252,
});
assert.deepStrictEqual(report.totals.physics, {
  books: 3,
  chapters: 22,
  knowledge: 84,
  experiments: 29,
  templates: 22,
  quantityLinks: 225,
  directionRules: 32,
});

const englishG7a = report.batches.find((batch) => batch.id === 'english-g7a-depth-v1.11');
assert.deepStrictEqual(englishG7a.counts, {
  units: 10,
  words: 80,
  grammar: 20,
  wordExamples: 160,
  grammarExamples: 60,
});
assert.deepStrictEqual(englishG7a.review, { verified: 100, reviewed: 0, untracked: 0 });

const physicsG9 = report.batches.find((batch) => batch.id === 'physics-g9-high-risk-v1.11');
assert.deepStrictEqual(physicsG9.counts, {
  chapters: 10,
  knowledge: 38,
  experiments: 10,
  templates: 10,
  quantityLinks: 104,
  directionRules: 13,
});
assert.deepStrictEqual(physicsG9.review, { verified: 38, reviewed: 0, untracked: 0 });

const tamperedEnglish = JSON.parse(JSON.stringify(english));
tamperedEnglish.units[0].vocabulary[0].phonetics.uk = [];
assert.throws(
  () => validateEnglishBatch(ENGLISH_HIGH_RISK_BATCHES[0], tamperedEnglish),
  /UK 音标/,
);

const tamperedPhysics = JSON.parse(JSON.stringify(physics));
tamperedPhysics.books[0].chapters[0].knowledgeItems[0].physicsDetail.review.status = 'reviewed';
assert.throws(
  () => validatePhysicsBatch(PHYSICS_HIGH_RISK_BATCHES[0], tamperedPhysics),
  /复核状态/,
);

console.log('OK subject high-risk batch contract');
