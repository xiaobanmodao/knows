const assert = require('assert');

const math = require('../packages/math/repository');
const {
  REVIEWED_MATH_CHAPTER_IDS,
  CHAPTER_REVIEW_RECORDS,
  getChapterReviewMeta,
} = require('../packages/math/data/chapter-review-meta');
const { getContentSource, isAllowedContentSourceUrl } = require('../data/content-source-registry');

const EXPECTED_IDS = [
  'ch01-rational',
  'ch02-expression',
  'ch03-linear-equation',
  'ch04-basic-geometry',
  'ch05-parallel',
  'ch06-real',
  'ch07-coordinate',
  'ch08-system',
  'ch09-inequality',
  'ch10-statistics',
  'ch11-triangle',
  'ch12-congruent',
  'ch13-symmetry',
  'ch14-polynomial',
  'ch15-fraction',
  'ch16-radical',
  'ch17-pythagorean',
  'ch18-parallelogram',
  'ch19-linear-function',
  'ch20-data-analysis',
  'ch21-quadratic-equation',
  'ch22-quadratic-function',
  'ch23-rotation',
  'ch24-circle',
  'ch25-probability',
  'ch26-inverse-function',
  'ch27-similarity',
  'ch28-trigonometry',
  'ch29-projection',
];
const EXPECTED_SOURCE_KEYS = new Set(['moe-math-curriculum-2022', 'pep-math-new-textbook-2024']);
const FIRST_BATCH_IDS = new Set(EXPECTED_IDS.slice(0, 10));
const SECOND_BATCH_IDS = new Set(EXPECTED_IDS.slice(10));
const MAPPING_BOUNDARY_IDS = new Set(['ch19-linear-function', 'ch20-data-analysis']);

function checkMathContainerReview() {
  assert.deepStrictEqual(REVIEWED_MATH_CHAPTER_IDS, EXPECTED_IDS);
  assert.deepStrictEqual(Object.keys(CHAPTER_REVIEW_RECORDS), EXPECTED_IDS);

  const chapters = new Map(math.getAllChapters().map((chapter) => [chapter.id, chapter]));
  EXPECTED_IDS.forEach((id) => {
    const chapter = chapters.get(id);
    const record = CHAPTER_REVIEW_RECORDS[id];
    assert.ok(chapter, `章节不存在：${id}`);
    assert.strictEqual(record.checkedTitle, chapter.title, `${id} 标题复核不一致`);
    assert.deepStrictEqual(record.checkedSections, chapter.officialSections, `${id} 小节复核不一致`);
    assert.strictEqual(chapter.contentMeta.status, 'verified', `${id} 运行时未挂载复核状态`);
    const meta = getChapterReviewMeta(id);
    assert.strictEqual(meta.status, 'verified', `${id} 复核状态无效`);
    assert.strictEqual(meta.statusLabel, '已复核', `${id} 复核状态标签无效`);
    assert.strictEqual(meta.reviewScope, 'stable-container', `${id} 复核范围无效`);
    assert.strictEqual(meta.reviewBatch, FIRST_BATCH_IDS.has(id) ? 'v1.9.3' : 'v1.9.4', `${id} 批次标识无效`);
    if (MAPPING_BOUNDARY_IDS.has(id)) {
      assert.strictEqual(meta.scopeNote, '仅复核稳定容器，不替代新版逐册目录映射', `${id} 目录边界说明缺失`);
    } else {
      assert.strictEqual(meta.scopeNote, undefined, `${id} 不应携带目录映射边界说明`);
    }
    assert.match(meta.reviewedAt, /^2026-08-10$/, `${id} 复核日期无效`);
    assert.strictEqual(meta.checkedTitle, chapter.title, `${id} 复核标题快照无效`);
    assert.deepStrictEqual(meta.checkedSections, chapter.officialSections, `${id} 复核小节快照无效`);
    assert.ok(Array.isArray(meta.evidence) && meta.evidence.length === 3, `${id} 复核证据不足`);
    assert.ok(Array.isArray(meta.sourceRefs) && meta.sourceRefs.length === 2, `${id} 官方来源不足`);
    assert.strictEqual(new Set(meta.sourceRefs.map((source) => source.key)).size, 2, `${id} 来源 key 重复`);
    meta.sourceRefs.forEach((source) => {
      assert.ok(EXPECTED_SOURCE_KEYS.has(source.key), `${id} 来源 key 未登记：${source.key}`);
      const registered = getContentSource(source.key);
      assert.ok(registered && registered.kind === 'official', `${id} 来源类型不受信任`);
      assert.strictEqual(registered.url, source.url, `${id} 来源 URL 与注册表不一致`);
      assert.ok(isAllowedContentSourceUrl(registered, source.url), `${id} 来源域名不受信任`);
    });
  });

  assert.strictEqual(FIRST_BATCH_IDS.size, 10, 'v1.9.3 第一批数量无效');
  assert.strictEqual(SECOND_BATCH_IDS.size, 19, 'v1.9.4 第二批数量无效');
  const first = getChapterReviewMeta(EXPECTED_IDS[0]);
  const second = getChapterReviewMeta(EXPECTED_IDS[0]);
  assert.notStrictEqual(first.sourceRefs, second.sourceRefs, '来源数组必须隔离');
  assert.notStrictEqual(first.checkedSections, second.checkedSections, '小节数组必须隔离');
  first.checkedSections.push('测试变更');
  assert.strictEqual(second.checkedSections.includes('测试变更'), false, '复核记录不得被调用方修改');

  return true;
}

checkMathContainerReview();
console.log(`OK math container review: ${EXPECTED_IDS.length} chapters`);

module.exports = {
  EXPECTED_IDS,
  checkMathContainerReview,
};
