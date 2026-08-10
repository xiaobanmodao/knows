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
const bindingQualityCheckCount = 118;
const grade8UpperUnitList = 'Unit 1 Happy Holiday；Unit 2 Home Sweet Home；Unit 3 Same or Different；Unit 4 Amazing Plants and Animals；Unit 5 What a Delicious Meal!；Unit 6 Plan for Yourself；Unit 7 When Tomorrow Comes；Unit 8 Let\'s Communicate!。';
const grade8LowerUnitList = 'Unit 1 Time to Relax；Unit 2 Stay Healthy；Unit 3 Growing Up；Unit 4 The Wonders of Nature；Unit 5 Nature\'s Temper；Unit 6 Crossing Cultures；Unit 7 A Good Read；Unit 8 Making a Difference。';
const grade9UpperDirectoryStatus = '目录证据状态：partial；当前公开页已核对 Unit 1-2；既有 Unit 3-8 保持可查阅的项目原创讲解，待完整官方目录复核。';
const englishStatusNamespaces = '`book.status` 表示运行时册次可用性，目录证据状态 `verified`、`partial`、`pending` 表示官方目录核对进度；两者属于不同的状态命名空间。九年级上册的运行时 `book.status` 为 `verified`，目录证据状态为 `partial`。';
const directoryImportBoundary = '这份独立官方目录证据记录只核对目录元数据，不核对教材正文、音频、题目、词表、图片或项目知识讲解，不是外部内容导入。';
const roadmapDirectoryBoundary = '英语目录门禁已加强为独立官方目录证据：四册具有完整当期目录页证据，九年级上册当前页面只核对 Unit 1-2，其余既有 Unit 3-8 等待完整官方目录复核；该记录只验证目录元数据，不是外部内容来源接入，不解除全局外部资料阻断。真实外部内容来源接入的下一批阻断仍为 `math-chapters-v1.11`，它要求完整官方逐册目录。';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertExactLine(source, line, message) {
  assert.match(source, new RegExp(`^${escapeRegExp(line)}$`, 'm'), message);
}

function assertEnglishSourceContract(source) {
  assertExactLine(source, grade8UpperUnitList, '八年级上册 Unit 3 标题必须精确为 Same or Different');
  assertExactLine(source, grade8LowerUnitList, '八年级下册 Unit 4 标题必须精确为 The Wonders of Nature');
  assert.doesNotMatch(source, /Same or Different\s*[?？]/, '不得保留带任意空格问号的 Same or Different 旧标题');
  assert.doesNotMatch(source, /The Wonder of Nature\b/, '不得保留 The Wonder of Nature 旧标题');
  // Source-evidence JSON gates ranges; this contract pins only the declared documentation status.
  const grade9UpperDirectoryStatusLines = source.split(/\r?\n/).filter((line) => line.startsWith('目录证据状态：'));
  assert.strictEqual(grade9UpperDirectoryStatusLines.length, 1, '九年级上册目录证据状态必须恰有一行');
  assert.strictEqual(grade9UpperDirectoryStatusLines[0], grade9UpperDirectoryStatus, '九年级上册目录证据状态必须保持 partial、Unit 1-2 已核对和 Unit 3-8 待复核边界');
  assertExactLine(source, englishStatusNamespaces, '运行时可用性与目录证据核对进度必须使用不同状态命名空间');
  assertExactLine(source, directoryImportBoundary, '独立官方目录证据必须明确不是外部内容导入');
}

function assertRoadmapDirectoryBoundary(source, line, label) {
  assertExactLine(source, line, `${label} 必须保留目录证据不解除外部内容来源接入和 math-chapters-v1.11 阻断的边界`);
}

function assertQualityMatrixContract({
  currentRoadmap = roadmap,
  currentProductRoadmap = productRoadmap,
  currentExpectedCount = expectedCount,
} = {}) {
  assert.strictEqual(
    currentExpectedCount,
    bindingQualityCheckCount,
    `质量矩阵绑定数量应固定为 ${bindingQualityCheckCount}`,
  );
  assert.match(
    currentRoadmap,
    new RegExp(`当前共 ${currentExpectedCount} 项`),
    `路线文档的质量矩阵数量应为 ${currentExpectedCount}`,
  );
  assert.match(
    currentRoadmap,
    new RegExp(`默认质量矩阵现登记 ${currentExpectedCount} 项`),
    `路线文档应准确说明默认质量矩阵登记了 ${currentExpectedCount} 项`,
  );
  assert.match(
    currentProductRoadmap,
    new RegExp(`当前路线分支的本地质量门禁为 ${currentExpectedCount} 项`),
    `总路线文档的质量矩阵数量应为 ${currentExpectedCount}`,
  );
  assert.doesNotMatch(currentRoadmap, /当前共 (?!118 项)\d+ 项/, '路线文档不得记录非 118 项的质量矩阵总数');
  assert.doesNotMatch(currentRoadmap, /默认质量矩阵现登记 (?!118 项)\d+ 项/, '路线文档不得记录非 118 项的默认矩阵数量');
  assert.doesNotMatch(currentProductRoadmap, /当前路线分支的本地质量门禁为 (?!118 项)\d+ 项/, '总路线文档不得记录非 118 项的本地质量门禁');
}

assertQualityMatrixContract();
assert.doesNotThrow(
  () => assertEnglishSourceContract(englishSource),
  '真实的九年级上册 partial、Unit 1-2 已核对和 Unit 3-8 待复核状态必须通过',
);
assertRoadmapDirectoryBoundary(roadmap, roadmapDirectoryBoundary, 'v1.11 路线文档');
assertRoadmapDirectoryBoundary(productRoadmap, `- ${roadmapDirectoryBoundary}`, '总路线文档');

assert.throws(
  () => assertEnglishSourceContract(englishSource.replace(
    grade9UpperDirectoryStatus,
    '目录证据状态：verified；当前公开页已核对 Unit 1-2；既有 Unit 3-8 保持可查阅的项目原创讲解，待完整官方目录复核。',
  )),
  assert.AssertionError,
  '将九年级上册目录证据状态误改为 verified 必须失败',
);
assert.throws(
  () => assertEnglishSourceContract(englishSource.replace(
    grade9UpperDirectoryStatus,
    '目录证据状态：verified；当前公开页已核对 Unit 1-8；既有 Unit 3-8 保持可查阅的项目原创讲解，已完成完整官方目录复核。',
  )),
  assert.AssertionError,
  '将九年级上册范围误改为 Unit 1-8 已核对必须失败',
);
assert.throws(
  () => assertEnglishSourceContract(`${englishSource}\n目录证据状态：verified；当前公开页已核对 Unit 1-8；既有 Unit 3-8 保持可查阅的项目原创讲解，待完整官方目录复核。`),
  assert.AssertionError,
  '追加冲突的九年级上册目录证据状态必须失败',
);
assert.throws(
  () => assertEnglishSourceContract(`${englishSource}\nSame or Different ?`),
  assert.AssertionError,
  '注入带空格问号的旧标题必须失败',
);
assert.throws(
  () => assertEnglishSourceContract(`${englishSource}\nThe Wonder of Nature`),
  assert.AssertionError,
  '注入单数旧标题必须失败',
);
assert.throws(
  () => assertEnglishSourceContract(englishSource.replace(directoryImportBoundary, '这份记录只核对目录元数据。')),
  assert.AssertionError,
  '删除目录证据不是外部内容导入的边界必须失败',
);
assert.throws(
  () => assertRoadmapDirectoryBoundary(
    roadmap.replace(
      roadmapDirectoryBoundary,
      roadmapDirectoryBoundary.replace('`math-chapters-v1.11`', '`english-chapters-v1.11`'),
    ),
    roadmapDirectoryBoundary,
    'v1.11 路线文档',
  ),
  assert.AssertionError,
  '替换实际外部内容来源阻断批次必须失败',
);
assert.throws(
  () => assertQualityMatrixContract({ currentRoadmap: roadmap.replace('当前共 118 项', '当前共 117 项') }),
  assert.AssertionError,
  '将质量矩阵总数改为 117 必须失败',
);
assert.throws(
  () => assertQualityMatrixContract({
    currentExpectedCount: 117,
    currentRoadmap: roadmap.replaceAll('118 项', '117 项'),
    currentProductRoadmap: productRoadmap.replaceAll('118 项', '117 项'),
  }),
  assert.AssertionError,
  '质量矩阵命令和文档同步改为 117 时仍必须违反绑定数量',
);

console.log('OK roadmap document consistency contract');
