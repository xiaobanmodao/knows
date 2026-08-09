const assert = require('assert');

const english = require('../packages/english/repository');
const content = require('../packages/english/data/english-content');
const { collectAuditEntities } = require('./content-audit');
const {
  REVIEWED_ENGLISH_TEMPLATE_IDS,
  TEMPLATE_REVIEW_RECORDS,
  buildEnglishTemplateReviewSnapshot,
  getEnglishTemplateReviewMeta,
} = require('../packages/english/data/template-review-meta');

const EXPECTED_TEMPLATE_IDS = [
  'eng-template-word-choice',
  'eng-template-sentence-skeleton',
  'eng-template-tense-timeline',
  'eng-template-grammar-connection',
  'eng-template-reading-evidence',
  'eng-template-writing-outline',
];

const EXPECTED_SOURCE_KEYS = new Set(['moe-english-curriculum-2022', 'pep-english-new-textbook-2025']);
const OFFICIAL_HOSTS = new Set(['www.moe.gov.cn', 'moe.gov.cn', 'www.pep.com.cn', 'pep.com.cn']);

function assertOfficialSource(source, owner) {
  assert.ok(source && EXPECTED_SOURCE_KEYS.has(source.key), `${owner}: source key invalid`);
  assert.ok(source.title, `${owner}: source title missing`);
  assert.ok(OFFICIAL_HOSTS.has(new URL(source.url).hostname), `${owner}: source host invalid`);
}

function checkCloneIsolation(templateId) {
  const first = getEnglishTemplateReviewMeta(templateId);
  const second = getEnglishTemplateReviewMeta(templateId);
  assert.notStrictEqual(first, second, `${templateId}: metadata object must be cloned`);
  assert.notStrictEqual(first.sourceRefs, second.sourceRefs, `${templateId}: sourceRefs must be cloned`);
  first.checkedTopicIds.push('mutated');
  assert.strictEqual(getEnglishTemplateReviewMeta(templateId).checkedTopicIds.includes('mutated'), false, `${templateId}: metadata array leaked mutation`);
}

function checkEnglishTemplateReview() {
  assert.deepStrictEqual(REVIEWED_ENGLISH_TEMPLATE_IDS, EXPECTED_TEMPLATE_IDS, 'English template IDs/order drifted');
  assert.strictEqual(content.templates.length, 6, 'English template count');
  assert.deepStrictEqual(content.templates.map((item) => item.id), EXPECTED_TEMPLATE_IDS, 'English content template IDs/order drifted');
  assert.deepStrictEqual(Object.keys(TEMPLATE_REVIEW_RECORDS), EXPECTED_TEMPLATE_IDS, 'English template review records incomplete');

  const topics = new Map(content.topics.map((topic) => [topic.id, topic]));
  const seen = new Set();
  const auditTemplates = new Map(collectAuditEntities()
    .filter((entity) => entity.subjectId === 'english' && entity.type === 'template')
    .map((entity) => [entity.id, entity]));

  content.templates.forEach((template) => {
    assert.ok(!seen.has(template.id), `${template.id}: duplicate template ID`);
    seen.add(template.id);

    const runtimeTemplate = english.getTemplateById('english', template.id);
    assert.ok(runtimeTemplate, `${template.id}: runtime template missing`);
    const record = TEMPLATE_REVIEW_RECORDS[template.id];
    const meta = getEnglishTemplateReviewMeta(template.id);

    assert.ok(record, `${template.id}: review record missing`);
    assert.strictEqual(record.checkedTitle, template.name, `${template.id}: title drifted`);
    assert.strictEqual(record.checkedCategory, template.category, `${template.id}: category drifted`);
    assert.deepStrictEqual(record.checkedTopicIds, template.topicIds, `${template.id}: parent topics drifted`);
    assert.ok(Array.isArray(template.topicIds) && template.topicIds.length === 1, `${template.id}: exactly one parent topic required`);
    template.topicIds.forEach((topicId) => {
      assert.ok(topics.has(topicId), `${template.id}: unknown parent ${topicId}`);
      assert.ok(topics.get(topicId).templateIds.includes(template.id), `${template.id}: topic template reference missing`);
    });
    assert.ok(Array.isArray(template.keywords) && template.keywords.length >= 3, `${template.id}: keywords incomplete`);
    assert.ok(Array.isArray(template.cues) && template.cues.length === 4, `${template.id}: cues must be 4`);
    assert.ok(Array.isArray(template.steps) && template.steps.length === 4, `${template.id}: steps must be 4`);
    assert.ok(Array.isArray(template.pitfalls) && template.pitfalls.length >= 2, `${template.id}: pitfalls incomplete`);
    assert.ok(template.summary, `${template.id}: summary missing`);
    assert.ok(Array.isArray(runtimeTemplate.examples) && runtimeTemplate.examples.length === 3, `${template.id}: runtime examples must be 3`);
    runtimeTemplate.examples.forEach((example, index) => {
      assert.ok(example.id && example.title && example.stem, `${template.id}: example ${index + 1} incomplete`);
      assert.ok(Array.isArray(example.steps) && example.steps.length >= 3, `${template.id}: example ${index + 1} steps incomplete`);
      assert.ok(example.summary, `${template.id}: example ${index + 1} summary missing`);
    });
    assert.ok(typeof runtimeTemplate.figure === 'string' && runtimeTemplate.figure, `${template.id}: runtime figure missing`);
    assert.strictEqual(record.runtimeExampleCount, runtimeTemplate.examples.length, `${template.id}: example count drifted`);
    assert.strictEqual(record.figureSource, template.figurePath ? 'dedicated-asset' : 'shared-generated-asset', `${template.id}: figure source drifted`);
    assert.strictEqual(record.snapshotHash, buildEnglishTemplateReviewSnapshot(template, runtimeTemplate).hash, `${template.id}: snapshot drifted`);
    assert.strictEqual(auditTemplates.get(template.id)?.reviewed.status, 'verified', `${template.id}: content audit did not receive reviewed metadata`);

    assert.ok(meta, `${template.id}: runtime review metadata missing`);
    assert.strictEqual(meta.status, 'verified', `${template.id}: review status invalid`);
    assert.strictEqual(meta.statusLabel, '已复核', `${template.id}: review status label invalid`);
    assert.strictEqual(meta.reviewedAt, '2026-08-10', `${template.id}: review date invalid`);
    assert.strictEqual(meta.reviewScope, 'stable-method-template', `${template.id}: review scope invalid`);
    assert.strictEqual(meta.reviewBatch, 'v1.9.9', `${template.id}: review batch invalid`);
    assert.ok(Array.isArray(meta.sourceRefs) && meta.sourceRefs.length === 2, `${template.id}: sources incomplete`);
    meta.sourceRefs.forEach((source) => assertOfficialSource(source, template.id));
    assert.ok(Array.isArray(meta.evidence) && meta.evidence.length >= 3, `${template.id}: evidence incomplete`);
    checkCloneIsolation(template.id);
  });

  assert.strictEqual(getEnglishTemplateReviewMeta('unknown-template'), null, 'unknown English template should not be reviewed');
  assert.strictEqual(seen.size, EXPECTED_TEMPLATE_IDS.length, 'reviewed English template total');
  return seen.size;
}

if (require.main === module) {
  try {
    const count = checkEnglishTemplateReview();
    console.log(`OK English template review: ${count} templates`);
  } catch (error) {
    console.error(`FOUND_ENGLISH_TEMPLATE_REVIEW_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_TEMPLATE_IDS,
  checkEnglishTemplateReview,
};
