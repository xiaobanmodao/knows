const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { getCheckCommands } = require('./check-v1.11-quality-matrix');

const root = path.resolve(__dirname, '..');
const roadmapPath = path.join(root, 'docs/v1.11后续开发路线.md');
const roadmap = fs.readFileSync(roadmapPath, 'utf8');
const expectedCount = getCheckCommands(false).length;

assert.match(
  roadmap,
  new RegExp(`当前共 ${expectedCount} 项`),
  `路线文档的质量矩阵数量应为 ${expectedCount}`,
);
assert.match(
  roadmap,
  new RegExp('当前质量矩阵 `'+expectedCount+'/'+expectedCount+'`'),
  `路线文档的质量矩阵结果应为 ${expectedCount}/${expectedCount}`,
);

console.log('OK roadmap document consistency contract');
