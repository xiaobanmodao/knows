const assert = require('assert');

const { themes } = require('../packages/chemistry/data/chemistry-themes');
const { topics: chemistryTopics } = require('../packages/chemistry/data/chemistry-topics');
const { templates: chemistryTemplates } = require('../packages/chemistry/data/chemistry-templates');
const { knowledgeItems: chemistryKnowledge } = require('../packages/chemistry/data/chemistry-knowledge');
const { topics: biologyTopics } = require('../packages/biology/data/biology-topics');
const { templates: biologyTemplates } = require('../packages/biology/data/biology-templates');
const { knowledgeItems: biologyKnowledge } = require('../packages/biology/data/biology-knowledge');
const chemistry = { themes, topics: chemistryTopics, templates: chemistryTemplates, knowledgeItems: chemistryKnowledge };
const biology = { topics: biologyTopics, templates: biologyTemplates, knowledgeItems: biologyKnowledge };
const {
  CHEMISTRY_HIGH_RISK_BATCHES,
  BIOLOGY_HIGH_RISK_BATCHES,
  buildFoundationHighRiskBatchReport,
  validateChemistryBatch,
  validateBiologyBatch,
} = require('./check-chemistry-biology-high-risk-batches');

const report = buildFoundationHighRiskBatchReport({ chemistryData: chemistry, biologyData: biology });
assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.batches.length, 11);
assert.strictEqual(CHEMISTRY_HIGH_RISK_BATCHES.length, 5);
assert.strictEqual(BIOLOGY_HIGH_RISK_BATCHES.length, 6);
assert.match(report.sourceHash, /^[a-f0-9]{64}$/);
assert.deepStrictEqual(report.totals.chemistry, {
  themes: 5,
  topics: 10,
  knowledge: 40,
  templates: 12,
  equations: 28,
  experiments: 8,
});
assert.deepStrictEqual(report.totals.biology, {
  topics: 6,
  knowledge: 36,
  templates: 6,
  examples: 108,
  safetyObservations: 6,
});

const chemistryProperties = report.batches.find((batch) => batch.id === 'chemistry-properties-high-risk-v1.11');
assert.deepStrictEqual(chemistryProperties.counts, {
  themes: 1,
  topics: 6,
  knowledge: 24,
  templates: 8,
  equations: 23,
  experiments: 8,
});
assert.deepStrictEqual(chemistryProperties.review, { verified: 38, reviewed: 0, untracked: 0 });

const biologyHealth = report.batches.find((batch) => batch.id === 'biology-health-high-risk-v1.11');
assert.deepStrictEqual(biologyHealth.counts, {
  topics: 1,
  knowledge: 6,
  templates: 1,
  examples: 18,
  safetyObservations: 2,
});
assert.deepStrictEqual(biologyHealth.review, { verified: 0, reviewed: 8, untracked: 0 });

const tamperedChemistry = JSON.parse(JSON.stringify(chemistry));
tamperedChemistry.knowledgeItems[0].topicId = 'chem-topic-unknown';
assert.throws(
  () => validateChemistryBatch(CHEMISTRY_HIGH_RISK_BATCHES[0], tamperedChemistry),
  /父级专题|unknown topic|parent/,
);

const tamperedChemistryExperiment = JSON.parse(JSON.stringify(chemistry));
const experiment = tamperedChemistryExperiment.knowledgeItems
  .flatMap((item) => item.sections)
  .find((section) => section.type === 'experiment');
experiment.safety = '';
assert.throws(
  () => validateChemistryBatch(CHEMISTRY_HIGH_RISK_BATCHES[1], tamperedChemistryExperiment),
  /安全|safety/,
);

const tamperedBiology = JSON.parse(JSON.stringify(biology));
tamperedBiology.knowledgeItems[0].review.status = 'untracked';
assert.throws(
  () => validateBiologyBatch(BIOLOGY_HIGH_RISK_BATCHES[0], tamperedBiology),
  /复核|review/,
);

console.log('OK chemistry biology high-risk batch contract');
