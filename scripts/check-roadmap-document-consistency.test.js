const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { getCheckCommands } = require('./check-v1.11-quality-matrix');

const root = path.resolve(__dirname, '..');
const roadmapPath = path.join(root, 'docs/v1.11后续开发路线.md');
const roadmap = fs.readFileSync(roadmapPath, 'utf8');
const productRoadmapPath = path.join(root, 'docs/后续开发与发布路线.md');
const productRoadmap = fs.readFileSync(productRoadmapPath, 'utf8');
const englishSourcePath = path.join(root, 'docs/人教版英语内容来源与编写规范.md');
const englishSource = fs.readFileSync(englishSourcePath, 'utf8');
const expectedCount = getCheckCommands(false).length;

assert.match(
  roadmap,
  new RegExp(`当前共 ${expectedCount} 项`),
  `路线文档的质量矩阵数量应为 ${expectedCount}`,
);
assert.match(
  roadmap,
  new RegExp(`默认质量矩阵现登记 ${expectedCount} 项`),
  `路线文档应准确说明默认质量矩阵登记了 ${expectedCount} 项`,
);
assert.match(
  productRoadmap,
  new RegExp(`当前路线分支的本地质量门禁为 ${expectedCount} 项`),
  `总路线文档的质量矩阵数量应为 ${expectedCount}`,
);

assert.match(englishSource, /Same or Different(?!\?)/);
assert.match(englishSource, /The Wonders of Nature/);
assert.match(englishSource, /独立官方目录证据/);
assert.match(englishSource, /九年级上册.*Unit 1-2|Unit 1-2.*九年级上册/s);
assert.doesNotMatch(englishSource, /九上全部单元标题和顺序已核对/);
assert.doesNotMatch(englishSource, /external-source/);

console.log('OK roadmap document consistency contract');
