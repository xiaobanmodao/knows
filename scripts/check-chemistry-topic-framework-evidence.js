const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { topics } = require('../packages/chemistry/data/chemistry-topics');
const { getChemistryContentMeta } = require('../packages/chemistry/data/content-review-meta');
const { getContentSource, isAllowedContentSourceUrl } = require('../data/content-source-registry');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_EVIDENCE_PATH = path.join(ROOT, 'docs/evidence/chemistry-topic-framework-review-2026.json');
const EVIDENCE_KIND = 'official-framework-support';
const REVIEW_ID = 'chemistry-topic-framework-support-2026-v1';
const REVIEWED_AT = '2026-08-11';

const REVIEWED_CHEMISTRY_TOPIC_IDS = [
  'chem-topic-lab',
  'chem-topic-air-oxygen',
  'chem-topic-water-solution',
  'chem-topic-particles-elements',
  'chem-topic-language-conservation',
  'chem-topic-carbon-fuels',
  'chem-topic-metals',
  'chem-topic-acids-bases',
  'chem-topic-salts-fertilizers',
  'chem-topic-materials-environment',
];

const EXPECTED_SOURCE_KEYS = [
  'moe-chemistry-2022',
  'moe-textbook-catalog-2024',
  'pep-chemistry-training-2024',
].sort();

const EXPECTED_SOURCE_CONTRACTS = new Map([
  ['moe-chemistry-2022', {
    role: 'curriculum-baseline',
    observation: '作为义务教育化学课程标准的官方基线，用于宏观课程框架观察。',
  }],
  ['moe-textbook-catalog-2024', {
    role: 'textbook-edition-catalog',
    observation: '国家目录列有人教版义务教育教科书化学九年级上下册，作为教材版本与册次的目录观察。',
  }],
  ['pep-chemistry-training-2024', {
    role: 'textbook-revision-context',
    observation: '人教社化学编辑室举办新教材培训会，公开说明培训聚焦编写思路和教材修订情况。',
  }],
]);

const EXPECTED_SUPPORTS = [
  '现有原创化学专题与官方公开课程、教材版本语境的宏观领域相容。',
  '专题稳定标识、标题与内部复核快照可追溯。',
];

const NOT_VERIFIED = [
  '教材逐章标题',
  '教材章节顺序',
  '教材册次映射',
  '教材正文与原始插图',
];

const EXPECTED_FRAMEWORK_DOMAINS = new Map([
  ['chem-topic-lab', ['chemical inquiry/laboratory safety']],
  ['chem-topic-air-oxygen', ['air/oxygen/combustion']],
  ['chem-topic-water-solution', ['water/solutions']],
  ['chem-topic-particles-elements', ['particles/elements']],
  ['chem-topic-language-conservation', ['chemical language/conservation']],
  ['chem-topic-carbon-fuels', ['carbon compounds/fuels']],
  ['chem-topic-metals', ['metals/materials']],
  ['chem-topic-acids-bases', ['acids/bases']],
  ['chem-topic-salts-fertilizers', ['salts/fertilizers']],
  ['chem-topic-materials-environment', ['materials/resources/environment']],
]);

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

function readEvidence(evidencePath) {
  try {
    return JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (error) {
    throw new Error(`化学专题官方框架佐证记录读取失败：${path.relative(ROOT, evidencePath)}（${error.code || error.message}）`);
  }
}

function assertAllowedFields(value, allowedFields, location) {
  Object.keys(value).forEach((key) => {
    assert.ok(allowedFields.has(key), `${location}: 不支持字段：${key}`);
  });
}

function assertNoProhibitedFields(value, location = 'record') {
  if (!value || typeof value !== 'object') return;

  Object.entries(value).forEach(([key, child]) => {
    const normalized = key.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const isProhibited = PROHIBITED_FIELD_TOKENS.some((token) => normalized.includes(token));
    assert.ok(!isProhibited, `${location}: 不得包含教材映射、内容输入或外部来源字段：${key}`);
    assertNoProhibitedFields(child, `${location}.${key}`);
  });
}

function buildChemistryTopicFrameworkSnapshot(topic) {
  const value = {
    id: topic.id,
    themeId: topic.themeId,
    title: topic.title,
    summary: topic.summary,
    objective: topic.objective,
    gradeBands: [...(topic.gradeBands || [])],
    keywords: [...(topic.keywords || [])],
    knowledgeIds: [...(topic.knowledgeIds || [])],
    templateIds: [...(topic.templateIds || [])],
    coverImage: topic.coverImage,
    diagramImages: (topic.diagramImages || []).map((diagram) => ({
      id: diagram.id,
      title: diagram.title,
      caption: diagram.caption,
      image: diagram.image,
    })),
  };

  return {
    value,
    hash: crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  };
}

function assertSources(sources) {
  assert.ok(Array.isArray(sources), 'sources 必须为数组');
  assert.strictEqual(sources.length, EXPECTED_SOURCE_KEYS.length, 'sources 必须恰好包含三条官方来源');

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

function assertTopicReviewMeta(topic) {
  const expectedMeta = getChemistryContentMeta();
  const meta = topic.contentMeta;

  assert.ok(meta && typeof meta === 'object', `${topic.id}: 缺少 contentMeta`);
  assert.strictEqual(meta.status, 'verified', `${topic.id}: 复核状态无效`);
  assert.strictEqual(meta.status, expectedMeta.status, `${topic.id}: 复核状态与化学基线不一致`);
  assert.strictEqual(meta.statusLabel, expectedMeta.statusLabel, `${topic.id}: 复核标签与化学基线不一致`);
  assert.deepStrictEqual([...(meta.sourceKeys || [])].sort(), EXPECTED_SOURCE_KEYS, `${topic.id}: 来源键不完整`);
  assert.strictEqual((meta.sourceRefs || []).length, EXPECTED_SOURCE_KEYS.length, `${topic.id}: 来源引用不完整`);
  meta.sourceRefs.forEach((source) => {
    const registered = getContentSource(source.key);
    assert.ok(registered && registered.kind === 'official', `${topic.id}/${source.key}: 复核来源无效`);
    assert.ok(typeof source.title === 'string' && source.title.trim(), `${topic.id}/${source.key}: 复核来源标题缺失`);
    assert.strictEqual(source.url, registered.url, `${topic.id}/${source.key}: 复核来源 URL 漂移`);
  });
}

function assertTopics(topicEvidence) {
  assert.strictEqual(topics.length, REVIEWED_CHEMISTRY_TOPIC_IDS.length, '当前化学专题数量不匹配');
  assert.deepStrictEqual(topics.map((topic) => topic.id), REVIEWED_CHEMISTRY_TOPIC_IDS, '当前化学专题 ID 或顺序漂移');
  assert.ok(Array.isArray(topicEvidence), 'topics 必须为数组');
  assert.strictEqual(topicEvidence.length, topics.length, 'topics 数量不匹配');

  const currentTopics = new Map(topics.map((topic) => [topic.id, topic]));
  const seen = new Set();
  topicEvidence.forEach((item, index) => {
    assert.ok(item && typeof item === 'object' && !Array.isArray(item), `topics[${index}] 必须为对象`);
    assertAllowedFields(item, TOPIC_FIELDS, `topics[${index}]`);
    assert.ok(!seen.has(item.id), `${item.id}: 专题佐证重复`);
    seen.add(item.id);

    const topic = currentTopics.get(item.id);
    assert.ok(topic, `${item.id}: 不是当前化学专题`);
    assert.strictEqual(item.title, topic.title, `${item.id}: 专题标题漂移`);
    assert.deepStrictEqual(item.frameworkDomains, EXPECTED_FRAMEWORK_DOMAINS.get(item.id), `${item.id}: frameworkDomains 不匹配`);
    assertTopicReviewMeta(topic);
    assert.strictEqual(item.reviewSnapshotHash, buildChemistryTopicFrameworkSnapshot(topic).hash, `${item.id}: 佐证快照与当前专题不一致`);
  });

  assert.strictEqual(seen.size, currentTopics.size, '专题佐证覆盖不完整');
}

function checkChemistryTopicFrameworkEvidence({ evidencePath = DEFAULT_EVIDENCE_PATH } = {}) {
  const evidence = readEvidence(path.resolve(evidencePath));

  assert.ok(evidence && typeof evidence === 'object' && !Array.isArray(evidence), '佐证记录必须为对象');
  assertNoProhibitedFields(evidence);
  assertAllowedFields(evidence, ROOT_FIELDS, 'record');
  assert.strictEqual(evidence.schemaVersion, 1, 'schemaVersion 不匹配');
  assert.strictEqual(evidence.reviewId, REVIEW_ID, 'reviewId 不匹配');
  assert.strictEqual(evidence.reviewedAt, REVIEWED_AT, 'reviewedAt 不匹配');
  assert.strictEqual(evidence.evidenceKind, EVIDENCE_KIND, 'evidenceKind 不匹配');
  assert.ok(evidence.scope && typeof evidence.scope === 'object' && !Array.isArray(evidence.scope), 'scope 必须为对象');
  assertAllowedFields(evidence.scope, SCOPE_FIELDS, 'scope');
  assert.deepStrictEqual(evidence.scope.supports, EXPECTED_SUPPORTS, 'scope.supports 不匹配');
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
    const result = checkChemistryTopicFrameworkEvidence();
    console.log(`OK chemistry topic framework evidence: ${result.topicCount} topics`);
  } catch (error) {
    console.error(`FOUND_CHEMISTRY_TOPIC_FRAMEWORK_EVIDENCE_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_EVIDENCE_PATH,
  EVIDENCE_KIND,
  NOT_VERIFIED,
  REVIEW_ID,
  REVIEWED_CHEMISTRY_TOPIC_IDS,
  buildChemistryTopicFrameworkSnapshot,
  checkChemistryTopicFrameworkEvidence,
};
