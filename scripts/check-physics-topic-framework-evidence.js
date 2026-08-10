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
const SCHEMA_VERSION = 1;
const REVIEW_ID = 'physics-topic-framework-support-2026-v1';
const REVIEWED_AT = '2026-08-10';
const EVIDENCE_KIND = 'official-framework-support';
const EXPECTED_SOURCE_KEYS = ['moe-physics-2022', 'pep-physics-public'];
const NOT_VERIFIED = [
  '教材逐章标题',
  '教材章节顺序',
  '教材册次映射',
  '教材正文与原始插图',
];
const ROOT_FIELDS = new Set(['schemaVersion', 'reviewId', 'reviewedAt', 'evidenceKind', 'scope', 'sources', 'topics']);
const SCOPE_FIELDS = new Set(['supports', 'notVerified']);
const SOURCE_FIELDS = new Set(['key', 'title', 'url', 'role', 'observation']);
const TOPIC_FIELDS = new Set(['id', 'title', 'reviewSnapshotHash', 'frameworkDomains']);
const PROHIBITED_FIELD_TOKENS = ['chapter', 'volume', 'lesson', 'body', 'sourceinput', 'externalsource'];
const RETIRED_FIELDS = new Set(['explicitexclusions', 'topicid', 'snapshothash']);
const EXPECTED_SOURCE_CONTRACTS = new Map([
  [
    'moe-physics-2022',
    {
      role: 'curriculum-baseline',
      observation: '作为义务教育物理课程标准的官方基线，用于宏观课程框架观察。',
    },
  ],
  [
    'pep-physics-public',
    {
      role: 'textbook-framework-summary',
      observation: '公开介绍提及全套共 22 章，并概述声光热、力学、能量与电磁等宏观进程。',
    },
  ],
]);
const EXPECTED_FRAMEWORK_DOMAINS = new Map([
  ['phy-topic-motion-sound', ['movement/sound']],
  ['phy-topic-light', ['light/imaging']],
  ['phy-topic-matter', ['heat/matter measurement']],
  ['phy-topic-force', ['force/fluid']],
  ['phy-topic-energy', ['work/energy']],
  ['phy-topic-electricity', ['electricity/electromagnetism']],
]);

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

function assertNoProhibitedFields(value, location = 'record') {
  if (!value || typeof value !== 'object') return;

  Object.entries(value).forEach(([key, child]) => {
    const normalized = key.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const isProhibited = RETIRED_FIELDS.has(normalized)
      || PROHIBITED_FIELD_TOKENS.some((token) => normalized.includes(token));
    assert.ok(!isProhibited, `${location}: 不得包含教材映射、内容输入或外部来源字段：${key}`);
    assertNoProhibitedFields(child, `${location}.${key}`);
  });
}

function assertAllowedFields(value, allowedFields, location) {
  Object.keys(value).forEach((key) => {
    assert.ok(allowedFields.has(key), `${location}: 不支持字段：${key}`);
  });
}

function assertSources(sources) {
  assert.ok(Array.isArray(sources), 'sources 必须为数组');
  assert.strictEqual(sources.length, EXPECTED_SOURCE_KEYS.length, 'sources 必须恰好包含两条官方来源');

  const sourceKeys = sources.map((source) => source && source.key).sort();
  assert.deepStrictEqual(sourceKeys, EXPECTED_SOURCE_KEYS, 'sources 官方来源键不匹配');
  sources.forEach((source, index) => {
    assert.ok(source && typeof source === 'object', 'sources 条目必须为对象');
    assertAllowedFields(source, SOURCE_FIELDS, `sources[${index}]`);
    const registered = getContentSource(source.key);
    const expected = EXPECTED_SOURCE_CONTRACTS.get(source.key);
    assert.ok(registered && registered.kind === 'official', `${source.key}: 必须为已登记官方来源`);
    assert.ok(expected, `${source.key}: 不是允许的官方来源`);
    assert.strictEqual(source.title, registered.title, `${source.key}: 来源标题漂移`);
    assert.strictEqual(source.url, registered.url, `${source.key}: 来源 URL 漂移`);
    assert.ok(isAllowedContentSourceUrl(registered, source.url), `${source.key}: 来源域名不受信任`);
    assert.ok(typeof source.observation === 'string' && source.observation.trim(), `${source.key}: observation 必须为非空文本`);
    assert.ok(source.observation.trim().length <= 240, `${source.key}: observation 必须为简短文本`);
    assert.strictEqual(source.role, expected.role, `${source.key}: role 不匹配`);
    assert.strictEqual(source.observation, expected.observation, `${source.key}: observation 不匹配`);
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
  topicEvidence.forEach((item, index) => {
    assert.ok(item && typeof item === 'object', 'topics 条目必须为对象');
    assertAllowedFields(item, TOPIC_FIELDS, `topics[${index}]`);
    assert.ok(!seen.has(item.id), `${item.id}: 专题佐证重复`);
    seen.add(item.id);

    const topic = currentTopics.get(item.id);
    assert.ok(topic, `${item.id}: 不是当前物理专题`);
    assert.strictEqual(item.title, topic.title, `${item.id}: 专题标题漂移`);
    assert.ok(Array.isArray(item.frameworkDomains) && item.frameworkDomains.length > 0, `${item.id}: frameworkDomains 必须为非空数组`);
    assert.ok(item.frameworkDomains.every((domain) => typeof domain === 'string' && domain.trim()), `${item.id}: frameworkDomains 必须只包含非空文本`);
    assert.deepStrictEqual(item.frameworkDomains, EXPECTED_FRAMEWORK_DOMAINS.get(item.id), `${item.id}: frameworkDomains 不匹配`);

    const reviewMeta = getPhysicsTopicReviewMeta(item.id);
    assert.ok(reviewMeta, `${item.id}: 当前专题复核元数据缺失`);
    const currentHash = buildPhysicsTopicReviewSnapshot(topic).hash;
    assert.strictEqual(reviewMeta.snapshotHash, currentHash, `${item.id}: 当前专题复核快照漂移`);
    assert.strictEqual(item.reviewSnapshotHash, currentHash, `${item.id}: 佐证快照与当前专题不一致`);
  });

  assert.strictEqual(seen.size, currentTopics.size, '专题佐证覆盖不完整');
}

function checkPhysicsTopicFrameworkEvidence({ evidencePath = DEFAULT_EVIDENCE_PATH } = {}) {
  const evidence = readEvidence(path.resolve(evidencePath));
  assert.ok(evidence && typeof evidence === 'object' && !Array.isArray(evidence), '佐证记录必须为对象');
  assertNoProhibitedFields(evidence);
  assertAllowedFields(evidence, ROOT_FIELDS, 'record');
  assert.strictEqual(evidence.schemaVersion, SCHEMA_VERSION, 'schemaVersion 不匹配');
  assert.strictEqual(evidence.reviewId, REVIEW_ID, 'reviewId 不匹配');
  assert.strictEqual(evidence.reviewedAt, REVIEWED_AT, 'reviewedAt 不匹配');
  assert.strictEqual(evidence.evidenceKind, EVIDENCE_KIND, 'evidenceKind 不匹配');
  assert.ok(evidence.scope && typeof evidence.scope === 'object' && !Array.isArray(evidence.scope), 'scope 必须为对象');
  assertAllowedFields(evidence.scope, SCOPE_FIELDS, 'scope');
  assert.ok(Array.isArray(evidence.scope.supports), 'scope.supports 必须为数组');
  assert.ok(evidence.scope.supports.length > 0 && evidence.scope.supports.every((item) => typeof item === 'string' && item.trim()), 'scope.supports 必须只包含非空文本');
  assert.deepStrictEqual(evidence.scope.notVerified, NOT_VERIFIED, 'scope.notVerified 不匹配');

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
  NOT_VERIFIED,
  REVIEW_ID,
  checkPhysicsTopicFrameworkEvidence,
};
