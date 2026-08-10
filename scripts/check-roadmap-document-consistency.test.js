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
const bindingQualityCheckCount = 117;
const grade8UpperUnitList = 'Unit 1 Happy Holiday；Unit 2 Home Sweet Home；Unit 3 Same or Different；Unit 4 Amazing Plants and Animals；Unit 5 What a Delicious Meal!；Unit 6 Plan for Yourself；Unit 7 When Tomorrow Comes；Unit 8 Let\'s Communicate!。';
const grade8LowerUnitList = 'Unit 1 Time to Relax；Unit 2 Stay Healthy；Unit 3 Growing Up；Unit 4 The Wonders of Nature；Unit 5 Nature\'s Temper；Unit 6 Crossing Cultures；Unit 7 A Good Read；Unit 8 Making a Difference。';
const grade9UpperDirectoryBoundary = '九年级上册当前页面只核对 Unit 1-2，其余既有 Unit 3-8 继续保持可查阅的项目原创讲解内容，等待完整官方目录复核。';
const grade9UpperFullDirectoryVerificationClaim = /(?:九年级上册|九上)\s*(?:的)?[^。！？\n]{0,16}(?:全部|所有|全册|8\s*个|八个)[^。！？\n]{0,16}单元[^。！？\n]{0,32}(?:(?:均|都|已全部|全部)?\s*(?:已)?(?:完成|通过)(?:了)?(?:完整|全部)?官方目录(?:核验|核对|复核|确认)|官方目录(?:核验|核对|复核|确认)[^。！？\n]{0,12}(?:均已|都已|均|都|已)?(?:完成|通过)(?:了)?)/;
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
  assertExactLine(source, grade9UpperDirectoryBoundary, '九年级上册目录边界必须同时说明 Unit 1-2、既有 Unit 3-8 和完整目录待核对');
  assert.doesNotMatch(
    source,
    /(?:九年级上册|九上)(?:的)?(?:全部|所有|8 个|八个)?(?:单元(?:的)?)?标题(?:和|及|、)顺序(?:均|都)?(?:已经|已)核对/,
    '不得宣称九年级上册全部单元标题和顺序已核对',
  );
  assert.doesNotMatch(
    source,
    grade9UpperFullDirectoryVerificationClaim,
    '不得宣称九年级上册全部或八个单元已完成官方目录核验',
  );
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
  assert.doesNotMatch(currentRoadmap, /当前共 (?!117 项)\d+ 项/, '路线文档不得记录非 117 项的质量矩阵总数');
  assert.doesNotMatch(currentRoadmap, /默认质量矩阵现登记 (?!117 项)\d+ 项/, '路线文档不得记录非 117 项的默认矩阵数量');
  assert.doesNotMatch(currentProductRoadmap, /当前路线分支的本地质量门禁为 (?!117 项)\d+ 项/, '总路线文档不得记录非 117 项的本地质量门禁');
}

assertQualityMatrixContract();
assertEnglishSourceContract(englishSource);
assertRoadmapDirectoryBoundary(roadmap, roadmapDirectoryBoundary, 'v1.11 路线文档');
assertRoadmapDirectoryBoundary(productRoadmap, `- ${roadmapDirectoryBoundary}`, '总路线文档');

assert.throws(
  () => assertEnglishSourceContract(englishSource.replace(grade9UpperDirectoryBoundary, '九年级上册当前页面只核对 Unit 1-2。')),
  assert.AssertionError,
  '删除九年级上册既有 Unit 3-8 和待核对边界必须失败',
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
  () => assertEnglishSourceContract(`${englishSource}\n九年级上册所有单元的标题和顺序均已核对。`),
  assert.AssertionError,
  '注入九年级上册全量核对声明必须失败',
);
assert.throws(
  () => assertEnglishSourceContract(`${englishSource}\n九年级上册 8 个单元均已完成官方目录核验。`),
  assert.AssertionError,
  '注入九年级上册八个单元完成官方目录核验声明必须失败',
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
  () => assertQualityMatrixContract({ currentRoadmap: roadmap.replace('当前共 117 项', '当前共 118 项') }),
  assert.AssertionError,
  '将质量矩阵总数改为 118 必须失败',
);
assert.throws(
  () => assertQualityMatrixContract({
    currentExpectedCount: 118,
    currentRoadmap: roadmap.replaceAll('117 项', '118 项'),
    currentProductRoadmap: productRoadmap.replaceAll('117 项', '118 项'),
  }),
  assert.AssertionError,
  '质量矩阵命令和文档同步改为 118 时仍必须违反绑定数量',
);

console.log('OK roadmap document consistency contract');
