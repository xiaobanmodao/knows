const assert = require('assert');

const english = require('../packages/english/repository');
const content = require('../packages/english/data/english-content');
const { collectAuditEntities } = require('./content-audit');
const {
  REVIEWED_ENGLISH_TOPIC_IDS,
  TOPIC_REVIEW_RECORDS,
  buildEnglishTopicReviewSnapshot,
  getEnglishTopicReviewMeta,
} = require('../packages/english/data/topic-review-meta');

const EXPECTED_TOPIC_IDS = [
  'eng-topic-vocabulary',
  'eng-topic-sentence',
  'eng-topic-tense',
  'eng-topic-grammar',
  'eng-topic-reading',
  'eng-topic-writing',
];

const EXPECTED_SOURCE_KEYS = new Set([
  'moe-english-curriculum-2022',
  'pep-english-new-textbook-2025',
]);

const OFFICIAL_HOSTS = new Set([
  'www.moe.gov.cn',
  'moe.gov.cn',
  'www.pep.com.cn',
  'pep.com.cn',
]);

function assertOfficialSource(source, owner) {
  assert.ok(source && EXPECTED_SOURCE_KEYS.has(source.key), `${owner}: source key invalid`);
  assert.ok(source.title, `${owner}: source title missing`);
  assert.ok(OFFICIAL_HOSTS.has(new URL(source.url).hostname), `${owner}: source host invalid`);
}

function checkCloneIsolation(topicId) {
  const first = getEnglishTopicReviewMeta(topicId);
  const second = getEnglishTopicReviewMeta(topicId);
  assert.notStrictEqual(first, second, `${topicId}: metadata object must be cloned`);
  assert.notStrictEqual(first.sourceRefs, second.sourceRefs, `${topicId}: sourceRefs must be cloned`);
  first.checkedKnowledgeIds.push('mutated');
  assert.strictEqual(getEnglishTopicReviewMeta(topicId).checkedKnowledgeIds.includes('mutated'), false, `${topicId}: metadata array leaked mutation`);
}

function checkEnglishTopicReview() {
  assert.deepStrictEqual(REVIEWED_ENGLISH_TOPIC_IDS, EXPECTED_TOPIC_IDS, 'English topic IDs/order drifted');
  assert.strictEqual(content.topics.length, 6, 'English topic count');
  assert.deepStrictEqual(content.topics.map((item) => item.id), EXPECTED_TOPIC_IDS, 'english-content topic IDs/order drifted');
  assert.deepStrictEqual(Object.keys(TOPIC_REVIEW_RECORDS), EXPECTED_TOPIC_IDS, 'English topic review records incomplete');

  const knowledgeById = new Map(content.knowledgeItems.map((item) => [item.id, item]));
  const templateById = new Map(content.templates.map((item) => [item.id, item]));
  const auditTopics = new Map(collectAuditEntities()
    .filter((entity) => entity.subjectId === 'english' && entity.type === 'topic')
    .map((entity) => [entity.id, entity]));
  const seen = new Set();

  content.topics.forEach((topic) => {
    assert.ok(!seen.has(topic.id), `${topic.id}: duplicate topic ID`);
    seen.add(topic.id);

    const runtimeTopic = english.getTopicById('english', topic.id);
    assert.ok(runtimeTopic, `${topic.id}: runtime topic missing`);
    const record = TOPIC_REVIEW_RECORDS[topic.id];
    const meta = getEnglishTopicReviewMeta(topic.id);
    assert.strictEqual(auditTopics.get(topic.id)?.reviewed.status, 'verified', `${topic.id}: content audit did not receive reviewed metadata`);

    assert.ok(record, `${topic.id}: review record missing`);
    assert.strictEqual(record.checkedTitle, topic.title, `${topic.id}: title drifted`);
    assert.deepStrictEqual(record.checkedGradeBands, topic.gradeBands, `${topic.id}: grade bands drifted`);
    assert.deepStrictEqual(record.checkedKnowledgeIds, topic.knowledgeIds, `${topic.id}: knowledge references drifted`);
    assert.deepStrictEqual(record.checkedTemplateIds, topic.templateIds, `${topic.id}: template references drifted`);
    assert.strictEqual(record.snapshotHash, buildEnglishTopicReviewSnapshot(topic).hash, `${topic.id}: snapshot drifted`);

    assert.ok(topic.summary, `${topic.id}: summary missing`);
    assert.ok(Array.isArray(topic.gradeBands) && topic.gradeBands.length >= 3, `${topic.id}: grade bands incomplete`);
    assert.ok(Array.isArray(topic.keywords) && topic.keywords.length >= 3, `${topic.id}: keywords incomplete`);
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
    });
    topic.templateIds.forEach((templateId) => {
      const template = templateById.get(templateId);
      assert.ok(template, `${topic.id}: missing template ${templateId}`);
      assert.ok(template.topicIds.includes(topic.id), `${templateId}: topic parent drifted`);
    });
    assert.strictEqual(topic.knowledgeCount, 3, `${topic.id}: knowledgeCount drifted`);
    assert.strictEqual(topic.exampleCount, 9, `${topic.id}: exampleCount drifted`);

    assert.ok(meta, `${topic.id}: runtime review metadata missing`);
    assert.strictEqual(meta.status, 'verified', `${topic.id}: review status invalid`);
    assert.strictEqual(meta.statusLabel, '已复核', `${topic.id}: review status label invalid`);
    assert.strictEqual(meta.reviewedAt, '2026-08-10', `${topic.id}: review date invalid`);
    assert.strictEqual(meta.reviewScope, 'stable-topic-container', `${topic.id}: review scope invalid`);
    assert.strictEqual(meta.reviewBatch, 'v1.9.7', `${topic.id}: review batch invalid`);
    assert.ok(Array.isArray(meta.sourceRefs) && meta.sourceRefs.length === 2, `${topic.id}: sources incomplete`);
    meta.sourceRefs.forEach((source) => assertOfficialSource(source, topic.id));
    assert.ok(Array.isArray(meta.evidence) && meta.evidence.length >= 3, `${topic.id}: evidence incomplete`);
    checkCloneIsolation(topic.id);
  });

  assert.strictEqual(getEnglishTopicReviewMeta('unknown-topic'), null, 'unknown English topic should not be reviewed');
  assert.strictEqual(seen.size, EXPECTED_TOPIC_IDS.length, 'reviewed English topic total');
  return seen.size;
}

if (require.main === module) {
  try {
    const count = checkEnglishTopicReview();
    console.log(`OK English topic review: ${count} topics`);
  } catch (error) {
    console.error(`FOUND_ENGLISH_TOPIC_REVIEW_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_TOPIC_IDS,
  checkEnglishTopicReview,
};
