const assert = require('assert');

const physics = require('../packages/physics/data/physics-curriculum');
const { collectPhysicsFormulaContractIssues } = require('./physics-formula-contract');

assert.deepStrictEqual(collectPhysicsFormulaContractIssues(physics.knowledgeItems), []);

const tampered = JSON.parse(JSON.stringify(physics.knowledgeItems[0]));
tampered.sections.find((section) => section.type === 'formula').formulaDetails[0].variables = [];
assert.throws(
  () => assert.deepStrictEqual(collectPhysicsFormulaContractIssues([tampered]), []),
  /公式变量|公式区块/,
);

console.log('OK physics formula contract test');
