const assert = require('assert');

const english = require('../packages/english/data/english-units');
const { collectEnglishDepthContractIssues } = require('./english-depth-contract');

assert.deepStrictEqual(collectEnglishDepthContractIssues(english), []);

const tampered = JSON.parse(JSON.stringify(english));
tampered.vocabulary[0].phonetics.uk = ['/tampered/'];
assert.throws(
  () => assert.deepStrictEqual(collectEnglishDepthContractIssues(tampered), []),
  /单词补深|运行时音标/,
);

const tamperedGrammar = JSON.parse(JSON.stringify(english));
tamperedGrammar.grammarPoints[0].conditions = ['tampered'];
assert.throws(
  () => assert.deepStrictEqual(collectEnglishDepthContractIssues(tamperedGrammar), []),
  /语法补深|运行时conditions/,
);

console.log('OK English depth contract test');
