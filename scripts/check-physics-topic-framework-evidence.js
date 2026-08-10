const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { topics } = require('../packages/physics/data/physics-content');
const {
  REVIEWED_PHYSICS_TOPIC_IDS,
  buildPhysicsTopicReviewSnapshot,
  getPhysicsTopicReviewMeta,
} = require('../packages/physics/data/topic-review-meta');
const { getContentSource, isAllowedContentSourceUrl } = require('../data/content-source-registry');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_EVIDENCE_PATH = path.join(ROOT, 'docs/evidence/physics-topic-framework-review-2026.json');
const REVIEW_ID = 'physics-topic-framework-review-2026';
const EVIDENCE_KIND = 'official-framework-support';
const EXPECTED_SOURCE_KEYS = ['moe-physics-2022', 'pep-physics-public'];
const EXPLICIT_EXCLUSIONS = [
  'chapter-title',
  'chapter-order',
  'volume-mapping',
  'edition-specific-textbook-mapping',
];
const PROHIBITED_CLAIM_FIELDS = new Set(['chaptertitle', 'chapterorder', 'volumemapping']);

function readEvidence(evidencePath) {
  let input;
  try {
    input = fs.readFileSync(evidencePath, 'utf8');
  } catch (error) {
    throw new Error(`物理专题官方框架佐证记录读取失败：${path.relative(ROOT, evidencePath)}（${error.code || error.message}）`);
  }

  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(`物理专题官方框架佐证记录读取失败：${path.relative(ROOT, evidencePath)}（${error.message}）`);
  }
}

function assertNoProhibitedClaims(value, location = 'record') {
  if (!value || typeof value !== 'object') return;

  Object.entries(value).forEach(([key, child]) => {
    const normalized = key.replace(/[^a-zA-Z]/g, '').toLowerCase();
    assert.ok(!PROHIBITED_CLAIM_FIELDS.has(normalized), `${location}: 不得声明教材章节标题、章节顺序或册次映射：${key}`);
    assertNoProhibitedClaims(child, `${location}.${key}`);
  });
}

function assertSources(sources) {
  assert.ok(Array.isArray(sources), 'sources 必须为数组');
  assert.strictEqual(sources.length, EXPECTED_SOURCE_KEYS.length, 'sources 必须恰好包含两条官方来源');

  const sourceKeys = sources.map((source) => source && source.key).sort();
  assert.deepStrictEqual(sourceKeys, EXPECTED_SOURCE_KEYS, 'sources 官方来源键不匹配');
  sources.forEach((source) => {
    assert.ok(source && typeof source === 'object', 'sources 条目必须为对象');
    const registered = getContentSource(source.key);
    assert.ok(registered && registered.kind === 'official', `${source.key}: 必须为已登记官方来源`);
    assert.strictEqual(source.title, registered.title, `${source.key}: 来源标题漂移`);
    assert.strictEqual(source.url, registered.url, `${source.key}: 来源 URL 漂移`);
    assert.ok(isAllowedContentSourceUrl(registered, source.url), `${source.key}: 来源域名不受信任`);
  });

  return sourceKeys;
}

function assertTopics(topicEvidence) {
  assert.ok(Array.isArray(topicEvidence), 'topics 必须为数组');
  assert.strictEqual(topicEvidence.length, topics.length, 'topics 数量不匹配');
  assert.strictEqual(topics.length, 6, '当前物理专题数量必须为 6');
  assert.deepStrictEqual(topics.map((topic) => topic.id), REVIEWED_PHYSICS_TOPIC_IDS, '当前物理专题 ID 不匹配');

  const currentTopics = new Map(topics.map((topic) => [topic.id, topic]));
  const seen = new Set();
  topicEvidence.forEach((item) => {
    assert.ok(item && typeof item === 'object', 'topics 条目必须为对象');
    assert.ok(!seen.has(item.topicId), `${item.topicId}: 专题佐证重复`);
    seen.add(item.topicId);

    const topic = currentTopics.get(item.topicId);
    assert.ok(topic, `${item.topicId}: 不是当前物理专题`);
    assert.strictEqual(item.title, topic.title, `${item.topicId}: 专题标题漂移`);
    assert.ok(Array.isArray(item.frameworkDomains) && item.frameworkDomains.length > 0, `${item.topicId}: frameworkDomains 必须为非空数组`);
    assert.ok(item.frameworkDomains.every((domain) => typeof domain === 'string' && domain.trim()), `${item.topicId}: frameworkDomains 必须只包含非空文本`);

    const reviewMeta = getPhysicsTopicReviewMeta(item.topicId);
    assert.ok(reviewMeta, `${item.topicId}: 当前专题复核元数据缺失`);
    const currentHash = buildPhysicsTopicReviewSnapshot(topic).hash;
    assert.strictEqual(reviewMeta.snapshotHash, currentHash, `${item.topicId}: 当前专题复核快照漂移`);
    assert.strictEqual(item.snapshotHash, currentHash, `${item.topicId}: 佐证快照与当前专题不一致`);
  });

  assert.strictEqual(seen.size, currentTopics.size, '专题佐证覆盖不完整');
}

function checkPhysicsTopicFrameworkEvidence({ evidencePath = DEFAULT_EVIDENCE_PATH } = {}) {
  const evidence = readEvidence(path.resolve(evidencePath));
  assert.ok(evidence && typeof evidence === 'object' && !Array.isArray(evidence), '佐证记录必须为对象');
  assert.strictEqual(evidence.reviewId, REVIEW_ID, 'reviewId 不匹配');
  assert.strictEqual(evidence.evidenceKind, EVIDENCE_KIND, 'evidenceKind 不匹配');
  assert.deepStrictEqual(evidence.explicitExclusions, EXPLICIT_EXCLUSIONS, 'explicitExclusions 不匹配');
  assertNoProhibitedClaims(evidence);

  const sourceKeys = assertSources(evidence.sources);
  assertTopics(evidence.topics);

  return {
    topicCount: topics.length,
    sourceKeys,
    evidenceKind: EVIDENCE_KIND,
  };
}

if (require.main === module) {
  try {
    const result = checkPhysicsTopicFrameworkEvidence();
    console.log(`OK physics topic framework evidence: ${result.topicCount} topics`);
  } catch (error) {
    console.error(`FOUND_PHYSICS_TOPIC_FRAMEWORK_EVIDENCE_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_EVIDENCE_PATH,
  EVIDENCE_KIND,
  EXPLICIT_EXCLUSIONS,
  REVIEW_ID,
  checkPhysicsTopicFrameworkEvidence,
};
