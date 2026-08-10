const assert = require('assert');

const chemistry = require('../packages/chemistry/data/chemistry-knowledge');
const repository = require('../packages/chemistry/repository');
const { collectChemistryBuildContractIssues } = require('./chemistry-build-contract');

function uniqueRuntimeSections(runtimeKnowledgeItems, type, idField) {
  const records = new Map();
  runtimeKnowledgeItems.forEach((knowledge) => {
    (knowledge.sections || [])
      .filter((section) => section.type === type)
      .forEach((section) => {
        if (!records.has(section[idField])) records.set(section[idField], section);
      });
  });
  return [...records.values()];
}

function makeFixture() {
  const runtimeKnowledgeItems = chemistry.knowledgeItems.map((knowledge) => (
    repository.getKnowledgeById(knowledge.id)
  ));

  return {
    sourceKnowledgeItems: chemistry.knowledgeItems,
    runtimeKnowledgeItems,
    sourceEquations: chemistry.getRawChemistrySections('equation'),
    runtimeEquations: uniqueRuntimeSections(runtimeKnowledgeItems, 'equation', 'equationId'),
    sourceExperiments: chemistry.getRawChemistrySections('experiment'),
    runtimeExperiments: uniqueRuntimeSections(runtimeKnowledgeItems, 'experiment', 'experimentId'),
  };
}

assert.deepStrictEqual(collectChemistryBuildContractIssues(makeFixture()), []);

const tamperedEquation = makeFixture();
const equation = tamperedEquation.runtimeKnowledgeItems
  .flatMap((knowledge) => knowledge.sections || [])
  .find((section) => section.type === 'equation');
equation.condition = '篡改后的反应条件';
tamperedEquation.runtimeEquations = uniqueRuntimeSections(
  tamperedEquation.runtimeKnowledgeItems,
  'equation',
  'equationId',
);
assert.throws(
  () => assert.deepStrictEqual(collectChemistryBuildContractIssues(tamperedEquation), []),
  /方程式运行时/,
);

const tamperedExperiment = makeFixture();
const experiment = tamperedExperiment.runtimeKnowledgeItems
  .flatMap((knowledge) => knowledge.sections || [])
  .find((section) => section.type === 'experiment');
experiment.safety = '篡改后的安全说明';
tamperedExperiment.runtimeExperiments = uniqueRuntimeSections(
  tamperedExperiment.runtimeKnowledgeItems,
  'experiment',
  'experimentId',
);
assert.throws(
  () => assert.deepStrictEqual(collectChemistryBuildContractIssues(tamperedExperiment), []),
  /实验运行时/,
);

console.log('OK chemistry build contract test');
