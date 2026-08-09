const assert = require('assert');

const math = require('../packages/math/repository');
const {
  REVIEWED_MATH_TOPIC_IDS,
  TOPIC_REVIEW_RECORDS,
  getTopicReviewMeta,
  buildTopicReviewSnapshot,
} = require('../packages/math/data/topic-review-meta');

const EXPECTED_IDS = [
  'g7-topic-rational',
  'g7-topic-expression',
  'g7-topic-linear-equation',
  'g7-topic-basic-geometry',
  'g7-topic-parallel',
  'g7-topic-real-number',
  'g7-topic-coordinate',
  'g7-topic-system',
  'g7-topic-inequality',
  'g7-topic-statistics',
  'g8-topic-triangle',
  'g8-topic-congruent',
  'g8-topic-symmetry',
  'g8-topic-polynomial',
  'g8-topic-fraction',
  'g8-topic-radical',
  'g8-topic-pythagorean',
  'g8-topic-parallelogram',
  'g8-topic-linear-function',
  'g8-topic-data-analysis',
  'g9-topic-quadratic-equation',
  'g9-topic-quadratic-function',
  'g9-topic-rotation',
  'g9-topic-circle',
  'g9-topic-probability',
  'g9-topic-inverse-function',
  'g9-topic-similarity',
  'g9-topic-trigonometry',
  'g9-topic-projection',
];
const OFFICIAL_HOSTS = new Set(['www.moe.gov.cn', 'moe.gov.cn', 'www.pep.com.cn', 'pep.com.cn']);
const EXPECTED_SOURCE_KEYS = new Set(['moe-math-curriculum-2022', 'pep-math-new-textbook-2024']);
const MAPPING_BOUNDARY_IDS = new Set(['g8-topic-linear-function', 'g8-topic-data-analysis']);

function checkMathTopicReview() {
  assert.deepStrictEqual(REVIEWED_MATH_TOPIC_IDS, EXPECTED_IDS);
  assert.deepStrictEqual(Object.keys(TOPIC_REVIEW_RECORDS), EXPECTED_IDS);

  const topics = math.getMathStudyMap().topicGroups.flatMap((group) => group.topics);
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  EXPECTED_IDS.forEach((id) => {
    const topic = topicById.get(id);
    const record = TOPIC_REVIEW_RECORDS[id];
    assert.ok(topic, `专题不存在：${id}`);
    assert.strictEqual(record.checkedTitle, topic.title, `${id} 标题复核不一致`);
    assert.strictEqual(record.checkedGradeId, topic.gradeId, `${id} 年级复核不一致`);
    assert.deepStrictEqual(record.checkedChapterIds, topic.chapterIds, `${id} 章节映射不一致`);
    assert.strictEqual(record.snapshotHash, buildTopicReviewSnapshot(topic).hash, `${id} 核心字段发生漂移`);
    const meta = getTopicReviewMeta(id);
    assert.strictEqual(meta.status, 'verified', `${id} 复核状态无效`);
    assert.strictEqual(meta.statusLabel, '已复核', `${id} 复核状态标签无效`);
    assert.strictEqual(meta.reviewScope, 'stable-topic-container');
    assert.strictEqual(meta.reviewBatch, 'v1.9.5');
    assert.match(meta.reviewedAt, /^2026-08-10$/, `${id} 复核日期无效`);
    assert.ok(topic.chapters.length === topic.chapterIds.length, `${id} 父级章节数量不一致`);
    assert.deepStrictEqual(topic.chapters.map((chapter) => chapter.id), topic.chapterIds, `${id} 父级章节不存在或顺序不一致`);
    assert.strictEqual(topic.contentMeta.status, 'verified', `${id} 运行时未挂载专题复核状态`);
    assert.ok(Array.isArray(topic.focus) && topic.focus.length >= 3, `${id} 专题重点不足`);
    assert.ok(Array.isArray(topic.signals) && topic.signals.length >= 3, `${id} 题干信号不足`);
    assert.ok(Array.isArray(topic.checkpoints) && topic.checkpoints.length >= 4, `${id} 检查点不足`);
    assert.ok(Array.isArray(meta.evidence) && meta.evidence.length === 3, `${id} 复核证据不足`);
    assert.ok(Array.isArray(meta.sourceRefs) && meta.sourceRefs.length === 2, `${id} 官方来源不足`);
    assert.strictEqual(new Set(meta.sourceRefs.map((source) => source.key)).size, 2, `${id} 来源 key 重复`);
    meta.sourceRefs.forEach((source) => {
      assert.ok(EXPECTED_SOURCE_KEYS.has(source.key), `${id} 来源 key 未登记：${source.key}`);
      assert.ok(OFFICIAL_HOSTS.has(new URL(source.url).hostname), `${id} 来源域名不受信任`);
    });
    if (MAPPING_BOUNDARY_IDS.has(id)) {
      assert.strictEqual(meta.scopeNote, '仅复核稳定专题与当前章节映射，不替代新版逐册目录映射', `${id} 目录边界说明缺失`);
    } else {
      assert.strictEqual(meta.scopeNote, undefined, `${id} 不应携带目录映射边界说明`);
    }
  });

  assert.strictEqual(getTopicReviewMeta('unknown-topic'), null, '未知专题不得返回复核元数据');
  const first = getTopicReviewMeta(EXPECTED_IDS[0]);
  const second = getTopicReviewMeta(EXPECTED_IDS[0]);
  assert.notStrictEqual(first.sourceRefs, second.sourceRefs, '来源数组必须隔离');
  first.sourceRefs.push({ key: 'mutated' });
  assert.strictEqual(second.sourceRefs.length, 2, '专题复核来源不得被调用方修改');
  return true;
}

checkMathTopicReview();
console.log(`OK math topic review: ${EXPECTED_IDS.length} topics`);

module.exports = { EXPECTED_IDS, checkMathTopicReview };
