const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { topics } = require('../packages/biology/data/biology-topics');
const biologyReviewMeta = require('../packages/biology/data/content-review-meta');
const { getContentSource, isAllowedContentSourceUrl } = require('../data/content-source-registry');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_EVIDENCE_PATH = path.join(ROOT, 'docs/evidence/biology-topic-framework-review-2026.json');
const SCHEMA_VERSION = 1;
const REVIEWED_AT = '2026-08-10';
const EVIDENCE_KIND = 'official-framework-support';
const REVIEW_ID = 'biology-topic-framework-support-2026-v1';
const EXPECTED_SOURCE_KEYS = ['moe-biology-curriculum-2022', 'pep-compulsory-biology-textbook'];
const NOT_VERIFIED = [
  '教材逐章标题',
  '教材章节顺序',
  '教材册次映射',
  '教材正文与原始插图',
];
const EXPECTED_SUPPORTS = [
  '现有原创生物专题与官方公开课程、教材单元框架的宏观领域相容。',
  '专题稳定标识、标题与内部复核快照可追溯。',
];
const ROOT_FIELDS = new Set(['schemaVersion', 'reviewId', 'reviewedAt', 'evidenceKind', 'scope', 'sources', 'topics']);
const SCOPE_FIELDS = new Set(['supports', 'notVerified']);
const SOURCE_FIELDS = new Set(['key', 'title', 'url', 'role', 'observation']);
const TOPIC_FIELDS = new Set(['id', 'title', 'reviewSnapshotHash', 'frameworkDomains']);
const PROHIBITED_FIELD_TOKENS = [
  'chapter',
  'volume',
  'lesson',
  'mapping',
  'sourcekind',
  'input',
  'manifest',
  'body',
  'resource',
  'asset',
  'image',
  'figure',
  'content',
];
const EXPECTED_SOURCE_CONTRACTS = new Map([
  [
    'moe-biology-curriculum-2022',
    {
      role: 'curriculum-baseline',
      observation: '作为义务教育生物学课程标准的官方基线，用于宏观课程框架观察。',
    },
  ],
  [
    'pep-compulsory-biology-textbook',
    {
      role: 'textbook-unit-framework-summary',
      observation: '公开介绍说明教材包括六个单元、对应课程标准前六个学习主题，并概述六个单元的宏观内容。',
    },
  ],
]);
const EXPECTED_FRAMEWORK_DOMAINS = new Map([
  ['bio-unit-cells', ['life/cells']],
  ['bio-unit-diversity', ['organism diversity/classification']],
  ['bio-unit-plants', ['plant life/processes']],
  ['bio-unit-health', ['human physiology/health']],
  ['bio-unit-environment', ['organism/environment']],
  ['bio-unit-evolution', ['continuity/evolution']],
]);

function readEvidence(evidencePath) {
  let input;

  try {
    input = fs.readFileSync(evidencePath, 'utf8');
  } catch (error) {
    throw new Error(`生物专题官方框架佐证记录读取失败：${path.relative(ROOT, evidencePath)}（${error.code || error.message}）`);
  }

  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(`生物专题官方框架佐证记录读取失败：${path.relative(ROOT, evidencePath)}（${error.message}）`);
  }
}

function assertNoProhibitedFields(value, location = 'record') {
  if (!value || typeof value !== 'object') return;

  Object.entries(value).forEach(([key, child]) => {
    const normalized = key.replace(/[^a-zA-Z]/g, '').toLowerCase();
    assert.ok(
      !PROHIBITED_FIELD_TOKENS.some((token) => normalized.includes(token)),
      `${location}: 不得包含教材映射、内容输入或外部资源字段：${key}`,
    );
    assertNoProhibitedFields(child, `${location}.${key}`);
  });
}

function assertAllowedFields(value, allowedFields, location) {
  Object.keys(value).forEach((key) => {
    assert.ok(allowedFields.has(key), `${location}: 不支持字段：${key}`);
  });
}

function buildBiologyTopicFrameworkSnapshot(topic) {
  const snapshot = {
    id: topic.id,
    unitLabel: topic.unitLabel,
    title: topic.title,
    summary: topic.summary,
    gradeBands: topic.gradeBands,
    keywords: topic.keywords,
    knowledgeIds: topic.knowledgeIds,
    templateIds: topic.templateIds,
    coverImage: topic.coverImage,
    diagramImage: topic.diagramImage,
  };
  return {
    snapshot,
    hash: crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),
  };
}

function assertRuntimeReview() {
  const review = biologyReviewMeta.getBiologyReview();
  assert.ok(review && typeof review === 'object' && !Array.isArray(review), '运行时 review 必须为对象');
  assert.strictEqual(review.status, 'reviewed', '运行时 review.status 必须为 reviewed');
  assert.deepStrictEqual([...(review.sourceKeys || [])].sort(), EXPECTED_SOURCE_KEYS, '运行时 review.sourceKeys 不完整');
  assert.ok(Array.isArray(review.sourceRefs), '运行时 review.sourceRefs 必须为数组');
  assert.strictEqual(review.sourceRefs.length, EXPECTED_SOURCE_KEYS.length, '运行时 review.sourceRefs 不完整');
  assert.deepStrictEqual(
    review.sourceRefs.map((source) => source && source.key).sort(),
    EXPECTED_SOURCE_KEYS,
    '复核来源键不完整',
  );
  review.sourceRefs.forEach((source, index) => {
    assert.ok(source && typeof source === 'object' && !Array.isArray(source), `review.sourceRefs[${index}] 必须为对象`);
    const registered = getContentSource(source.key);
    assert.ok(registered && registered.kind === 'official', `${source.key}: 复核来源无效`);
    assert.strictEqual(source.url, registered.url, `复核来源 URL 漂移：${source.key}`);
    assert.ok(isAllowedContentSourceUrl(registered, source.url), `${source.key}: 复核来源域名不受信任`);
  });
}

function assertSources(sources) {
  assert.ok(Array.isArray(sources), 'sources 必须为数组');
  assert.strictEqual(sources.length, EXPECTED_SOURCE_KEYS.length, 'sources 必须恰好包含两条官方来源');
  const sourceKeys = sources.map((source) => source && source.key).sort();
  assert.deepStrictEqual(sourceKeys, EXPECTED_SOURCE_KEYS, 'sources 官方来源键不匹配');

  sources.forEach((source, index) => {
    assert.ok(source && typeof source === 'object' && !Array.isArray(source), `sources[${index}] 必须为对象`);
    assertAllowedFields(source, SOURCE_FIELDS, `sources[${index}]`);
    const registered = getContentSource(source.key);
    const expected = EXPECTED_SOURCE_CONTRACTS.get(source.key);
    assert.ok(registered && registered.kind === 'official', `${source.key}: 必须为已登记官方来源`);
    assert.ok(expected, `${source.key}: 不是允许的官方来源`);
    assert.strictEqual(source.title, registered.title, `${source.key}: 来源标题漂移`);
    assert.strictEqual(source.url, registered.url, `${source.key}: 来源 URL 漂移`);
    assert.ok(isAllowedContentSourceUrl(registered, source.url), `${source.key}: 来源域名不受信任`);
    assert.strictEqual(source.role, expected.role, `${source.key}: role 不匹配`);
    assert.strictEqual(source.observation, expected.observation, `${source.key}: observation 不匹配`);
    assert.ok(typeof source.observation === 'string' && source.observation.trim(), `${source.key}: observation 必须为非空文本`);
    assert.ok(source.observation.trim().length <= 240, `${source.key}: observation 必须为简短文本`);
  });

  return sourceKeys;
}

function assertTopics(topicEvidence) {
  assert.strictEqual(topics.length, EXPECTED_FRAMEWORK_DOMAINS.size, '当前生物专题数量不匹配');
  assert.deepStrictEqual(topics.map((topic) => topic.id), [...EXPECTED_FRAMEWORK_DOMAINS.keys()], '当前生物专题 ID 或顺序漂移');
  assert.ok(Array.isArray(topicEvidence), 'topics 必须为数组');
  assert.strictEqual(topicEvidence.length, topics.length, 'topics 数量不匹配');
  assert.deepStrictEqual(
    topicEvidence.map((item) => item && item.id),
    topics.map((topic) => topic.id),
    '专题佐证 ID 或顺序漂移',
  );

  const currentTopics = new Map(topics.map((topic) => [topic.id, topic]));
  const seen = new Set();
  topicEvidence.forEach((item, index) => {
    assert.ok(item && typeof item === 'object' && !Array.isArray(item), `topics[${index}] 必须为对象`);
    assertAllowedFields(item, TOPIC_FIELDS, `topics[${index}]`);
    assert.ok(!seen.has(item.id), `${item.id}: 专题佐证重复`);
    seen.add(item.id);

    const topic = currentTopics.get(item.id);
    assert.ok(topic, `${item.id}: 不是当前生物专题`);
    assert.strictEqual(item.title, topic.title, `${item.id}: 专题标题漂移`);
    assert.deepStrictEqual(item.frameworkDomains, EXPECTED_FRAMEWORK_DOMAINS.get(item.id), `${item.id}: frameworkDomains 不匹配`);
    assert.strictEqual(item.reviewSnapshotHash, buildBiologyTopicFrameworkSnapshot(topic).hash, `${item.id}: 佐证快照与当前专题不一致`);
  });

  assert.strictEqual(seen.size, currentTopics.size, '专题佐证覆盖不完整');
}

function validateEvidence(evidence) {
  assert.ok(evidence && typeof evidence === 'object' && !Array.isArray(evidence), '佐证记录必须为对象');
  assertNoProhibitedFields(evidence);
  assertAllowedFields(evidence, ROOT_FIELDS, 'record');
  assert.strictEqual(evidence.schemaVersion, SCHEMA_VERSION, 'schemaVersion 不匹配');
  assert.strictEqual(evidence.reviewId, REVIEW_ID, 'reviewId 不匹配');
  assert.strictEqual(evidence.reviewedAt, REVIEWED_AT, 'reviewedAt 不匹配');
  assert.strictEqual(evidence.evidenceKind, EVIDENCE_KIND, 'evidenceKind 不匹配');
  assert.ok(evidence.scope && typeof evidence.scope === 'object' && !Array.isArray(evidence.scope), 'scope 必须为对象');
  assertAllowedFields(evidence.scope, SCOPE_FIELDS, 'scope');
  assert.deepStrictEqual(evidence.scope.supports, EXPECTED_SUPPORTS, 'scope.supports 不匹配');
  assert.deepStrictEqual(evidence.scope.notVerified, NOT_VERIFIED, 'scope.notVerified 不匹配');

  const sourceKeys = assertSources(evidence.sources);
  assertRuntimeReview();
  assertTopics(evidence.topics);

  return {
    topicCount: topics.length,
    sourceKeys,
    evidenceKind: EVIDENCE_KIND,
  };
}

function checkBiologyTopicFrameworkEvidence({ evidencePath = DEFAULT_EVIDENCE_PATH } = {}) {
  return validateEvidence(readEvidence(path.resolve(evidencePath)));
}

if (require.main === module) {
  try {
    checkBiologyTopicFrameworkEvidence();
    console.log('OK biology topic framework evidence');
  } catch (error) {
    console.error(`FOUND_BIOLOGY_TOPIC_FRAMEWORK_EVIDENCE_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_EVIDENCE_PATH,
  EVIDENCE_KIND,
  NOT_VERIFIED,
  REVIEW_ID,
  buildBiologyTopicFrameworkSnapshot,
  checkBiologyTopicFrameworkEvidence,
};
