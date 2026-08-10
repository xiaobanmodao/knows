const assert = require('assert');

const physics = require('../packages/physics/repository');
const content = require('../packages/physics/data/physics-content');
const { collectAuditEntities } = require('./content-audit');
const {
  REVIEWED_PHYSICS_TOPIC_IDS,
  TOPIC_REVIEW_RECORDS,
  buildPhysicsTopicReviewSnapshot,
  getPhysicsTopicReviewMeta,
} = require('../packages/physics/data/topic-review-meta');
const { getContentSource, isAllowedContentSourceUrl } = require('../data/content-source-registry');

const EXPECTED_TOPIC_IDS = [
  'phy-topic-motion-sound',
  'phy-topic-light',
  'phy-topic-matter',
  'phy-topic-force',
  'phy-topic-energy',
  'phy-topic-electricity',
];

const EXPECTED_SOURCE_KEYS = new Set(['moe-physics-2022', 'pep-physics-public']);

function assertOfficialSource(source, owner) {
  assert.ok(source && EXPECTED_SOURCE_KEYS.has(source.key), `${owner}: source key invalid`);
  assert.ok(source.title, `${owner}: source title missing`);
  const registered = getContentSource(source.key);
  assert.ok(registered && registered.kind === 'official', `${owner}: source kind invalid`);
  assert.strictEqual(registered.url, source.url, `${owner}: source URL drifted`);
  assert.ok(isAllowedContentSourceUrl(registered, source.url), `${owner}: source host invalid`);
}

function checkCloneIsolation(topicId) {
  const first = getPhysicsTopicReviewMeta(topicId);
  const second = getPhysicsTopicReviewMeta(topicId);
  assert.notStrictEqual(first, second, `${topicId}: metadata object must be cloned`);
  assert.notStrictEqual(first.sourceRefs, second.sourceRefs, `${topicId}: sourceRefs must be cloned`);
  first.checkedKnowledgeIds.push('mutated');
  assert.strictEqual(getPhysicsTopicReviewMeta(topicId).checkedKnowledgeIds.includes('mutated'), false, `${topicId}: metadata array leaked mutation`);
}

function checkPhysicsTopicReview() {
  assert.deepStrictEqual(REVIEWED_PHYSICS_TOPIC_IDS, EXPECTED_TOPIC_IDS, 'physics topic IDs/order drifted');
  assert.strictEqual(content.topics.length, 6, 'physics topic count');
  assert.deepStrictEqual(content.topics.map((item) => item.id), EXPECTED_TOPIC_IDS, 'physics-content topic IDs/order drifted');
  assert.deepStrictEqual(Object.keys(TOPIC_REVIEW_RECORDS), EXPECTED_TOPIC_IDS, 'physics topic review records incomplete');

  const knowledgeById = new Map(content.knowledgeItems.map((item) => [item.id, item]));
  const templateById = new Map(content.templates.map((item) => [item.id, item]));
  const auditTopics = new Map(collectAuditEntities()
    .filter((entity) => entity.subjectId === 'physics' && entity.type === 'topic')
    .map((entity) => [entity.id, entity]));
  const seen = new Set();

  content.topics.forEach((topic) => {
    assert.ok(!seen.has(topic.id), `${topic.id}: duplicate topic ID`);
    seen.add(topic.id);

    const runtimeTopic = physics.getTopicById('physics', topic.id);
    assert.ok(runtimeTopic, `${topic.id}: runtime topic missing`);
    const record = TOPIC_REVIEW_RECORDS[topic.id];
    const meta = getPhysicsTopicReviewMeta(topic.id);

    assert.ok(record, `${topic.id}: review record missing`);
    assert.strictEqual(record.checkedTitle, topic.title, `${topic.id}: title drifted`);
    assert.deepStrictEqual(record.checkedGradeBands, topic.gradeBands, `${topic.id}: grade bands drifted`);
    assert.deepStrictEqual(record.checkedKnowledgeIds, topic.knowledgeIds, `${topic.id}: knowledge references drifted`);
    assert.deepStrictEqual(record.checkedTemplateIds, topic.templateIds, `${topic.id}: template references drifted`);
    assert.strictEqual(record.snapshotHash, buildPhysicsTopicReviewSnapshot(topic).hash, `${topic.id}: snapshot drifted`);
    assert.strictEqual(auditTopics.get(topic.id)?.reviewed.status, 'verified', `${topic.id}: content audit did not receive reviewed metadata`);

    assert.ok(topic.summary, `${topic.id}: summary missing`);
    assert.ok(Array.isArray(topic.gradeBands) && topic.gradeBands.length >= 2, `${topic.id}: grade bands incomplete`);
    assert.ok(Array.isArray(topic.keywords) && topic.keywords.length >= 4, `${topic.id}: keywords incomplete`);
    assert.ok(Array.isArray(topic.signals) && topic.signals.length >= 4, `${topic.id}: signals incomplete`);
    assert.ok(Array.isArray(topic.checkpoints) && topic.checkpoints.length === 4, `${topic.id}: checkpoints must be 4`);
    topic.checkpoints.forEach((checkpoint, index) => {
      assert.ok(checkpoint.title && checkpoint.method, `${topic.id}: checkpoint ${index + 1} incomplete`);
    });
    assert.ok(topic.coverImage && topic.diagramImage && topic.diagramCaption, `${topic.id}: visual references incomplete`);
    assert.strictEqual(topic.knowledgeIds.length, 3, `${topic.id}: knowledge count`);
    assert.strictEqual(topic.templateIds.length, 1, `${topic.id}: template count`);
    topic.knowledgeIds.forEach((knowledgeId) => {
      const knowledge = knowledgeById.get(knowledgeId);
      assert.ok(knowledge, `${topic.id}: missing knowledge ${knowledgeId}`);
      assert.strictEqual(knowledge.topicId, topic.id, `${topic.id}: knowledge parent drifted`);
      assert.strictEqual((knowledge.problems || []).length, 3, `${knowledgeId}: example count`);
      assert.ok(Array.isArray(knowledge.sections) && knowledge.sections.length >= 3, `${knowledgeId}: sections incomplete`);
    });
    topic.templateIds.forEach((templateId) => {
      const template = templateById.get(templateId);
      assert.ok(template, `${topic.id}: missing template ${templateId}`);
      assert.ok(template.topicIds.includes(topic.id), `${templateId}: topic parent drifted`);
    });
    assert.strictEqual(topic.knowledgeCount, 3, `${topic.id}: knowledgeCount drifted`);
    assert.strictEqual(topic.exampleCount, 9, `${topic.id}: exampleCount drifted`);
    assert.ok(Array.isArray(runtimeTopic.chapters) && runtimeTopic.chapters.length >= 1, `${topic.id}: chapter context missing`);

    assert.ok(meta, `${topic.id}: runtime review metadata missing`);
    assert.strictEqual(meta.status, 'verified', `${topic.id}: review status invalid`);
    assert.strictEqual(meta.statusLabel, '已复核', `${topic.id}: review status label invalid`);
    assert.strictEqual(meta.reviewedAt, '2026-08-10', `${topic.id}: review date invalid`);
    assert.strictEqual(meta.reviewScope, 'stable-topic-container', `${topic.id}: review scope invalid`);
    assert.strictEqual(meta.reviewBatch, 'v1.9.8', `${topic.id}: review batch invalid`);
    assert.ok(Array.isArray(meta.sourceRefs) && meta.sourceRefs.length === 2, `${topic.id}: sources incomplete`);
    meta.sourceRefs.forEach((source) => assertOfficialSource(source, topic.id));
    assert.ok(Array.isArray(meta.evidence) && meta.evidence.length >= 3, `${topic.id}: evidence incomplete`);
    checkCloneIsolation(topic.id);
  });

  assert.strictEqual(getPhysicsTopicReviewMeta('unknown-topic'), null, 'unknown physics topic should not be reviewed');
  assert.strictEqual(seen.size, EXPECTED_TOPIC_IDS.length, 'reviewed physics topic total');
  return seen.size;
}

if (require.main === module) {
  try {
    const count = checkPhysicsTopicReview();
    console.log(`OK physics topic review: ${count} topics`);
  } catch (error) {
    console.error(`FOUND_PHYSICS_TOPIC_REVIEW_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_TOPIC_IDS,
  checkPhysicsTopicReview,
};
