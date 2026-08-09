const assert = require('assert');

const physics = require('../packages/physics/repository');
const physicsContent = require('../packages/physics/data/physics-content');
const physicsCurriculum = require('../packages/physics/data/physics-curriculum');
const { collectAuditEntities } = require('./content-audit');
const {
  REVIEWED_PHYSICS_TEMPLATE_IDS,
  TEMPLATE_REVIEW_RECORDS,
  buildPhysicsTemplateReviewSnapshot,
  getPhysicsTemplateReviewMeta,
} = require('../packages/physics/data/template-review-meta');

const EXPECTED_CHAPTER_TEMPLATE_IDS = [
  'phy-template-ch01-motion',
  'phy-template-ch02-sound',
  'phy-template-ch03-state',
  'phy-template-ch04-light',
  'phy-template-ch05-lens',
  'phy-template-ch06-density',
  'phy-template-ch07-force',
  'phy-template-ch08-balance',
  'phy-template-ch09-pressure',
  'phy-template-ch10-buoyancy',
  'phy-template-ch11-work-energy',
  'phy-template-ch12-machines',
  'phy-template-ch13-thermal',
  'phy-template-ch14-engine',
  'phy-template-ch15-circuit',
  'phy-template-ch16-voltage',
  'phy-template-ch17-ohm',
  'phy-template-ch18-power',
  'phy-template-ch19-safety',
  'phy-template-ch20-electromagnetism',
  'phy-template-ch21-information',
  'phy-template-ch22-energy',
];

const EXPECTED_STRUCTURED_TEMPLATE_IDS = [
  'phy-template-motion-graph',
  'phy-template-ray-diagram',
  'phy-template-density-lab',
  'phy-template-force-analysis',
  'phy-template-energy-flow',
  'phy-template-circuit-analysis',
];

const EXPECTED_TEMPLATE_IDS = [...EXPECTED_CHAPTER_TEMPLATE_IDS, ...EXPECTED_STRUCTURED_TEMPLATE_IDS];
const EXPECTED_SOURCE_KEYS = new Set(['moe-physics-2022', 'pep-physics-public']);
const OFFICIAL_HOSTS = new Set(['www.moe.gov.cn', 'moe.gov.cn', 'www.pep.com.cn', 'pep.com.cn']);

function assertOfficialSource(source, owner) {
  assert.ok(source && EXPECTED_SOURCE_KEYS.has(source.key), `${owner}: source key invalid`);
  assert.ok(source.title, `${owner}: source title missing`);
  assert.ok(OFFICIAL_HOSTS.has(new URL(source.url).hostname), `${owner}: source host invalid`);
}

function checkCloneIsolation(templateId) {
  const first = getPhysicsTemplateReviewMeta(templateId);
  const second = getPhysicsTemplateReviewMeta(templateId);
  assert.notStrictEqual(first, second, `${templateId}: metadata object must be cloned`);
  assert.notStrictEqual(first.sourceRefs, second.sourceRefs, `${templateId}: sourceRefs must be cloned`);
  first.checkedParentIds.push('mutated');
  assert.strictEqual(getPhysicsTemplateReviewMeta(templateId).checkedParentIds.includes('mutated'), false, `${templateId}: metadata array leaked mutation`);
}

function getTemplateCollections() {
  return [
    ...physicsCurriculum.templates.map((template) => ({ template, parentType: 'chapter', auditType: 'template' })),
    ...physicsContent.templates.map((template) => ({ template, parentType: 'topic', auditType: 'structured-template' })),
  ];
}

function checkExample(example, owner, index) {
  assert.ok(example.id && example.title && example.stem, `${owner}: example ${index + 1} incomplete`);
  assert.ok(Array.isArray(example.steps) && example.steps.length >= 3, `${owner}: example ${index + 1} steps incomplete`);
  assert.ok(example.summary, `${owner}: example ${index + 1} summary missing`);
}

function checkPhysicsTemplateReview() {
  assert.deepStrictEqual(REVIEWED_PHYSICS_TEMPLATE_IDS, EXPECTED_TEMPLATE_IDS, 'physics template IDs/order drifted');
  assert.strictEqual(physicsCurriculum.templates.length, 22, 'physics chapter template count');
  assert.strictEqual(physicsContent.templates.length, 6, 'physics structured template count');
  assert.deepStrictEqual(physicsCurriculum.templates.map((item) => item.id), EXPECTED_CHAPTER_TEMPLATE_IDS, 'chapter template IDs/order drifted');
  assert.deepStrictEqual(physicsContent.templates.map((item) => item.id), EXPECTED_STRUCTURED_TEMPLATE_IDS, 'structured template IDs/order drifted');
  assert.deepStrictEqual(Object.keys(TEMPLATE_REVIEW_RECORDS), EXPECTED_TEMPLATE_IDS, 'physics template review records incomplete');

  const chapters = new Map(physicsCurriculum.chapters.map((chapter) => [chapter.id, chapter]));
  const topics = new Map(physicsContent.topics.map((topic) => [topic.id, topic]));
  const auditTemplates = new Map(collectAuditEntities()
    .filter((entity) => entity.subjectId === 'physics' && ['template', 'structured-template'].includes(entity.type))
    .map((entity) => [entity.id, entity]));
  const seen = new Set();

  getTemplateCollections().forEach(({ template, parentType, auditType }) => {
    assert.ok(!seen.has(template.id), `${template.id}: duplicate template ID`);
    seen.add(template.id);

    const runtimeTemplate = physics.getTemplateById('physics', template.id);
    assert.ok(runtimeTemplate, `${template.id}: runtime template missing`);
    const record = TEMPLATE_REVIEW_RECORDS[template.id];
    const meta = getPhysicsTemplateReviewMeta(template.id);

    assert.ok(record, `${template.id}: review record missing`);
    assert.strictEqual(record.checkedTitle, template.name, `${template.id}: title drifted`);
    assert.strictEqual(record.checkedCategory, template.category, `${template.id}: category drifted`);
    assert.strictEqual(record.parentType, parentType, `${template.id}: parent type drifted`);
    const parentIds = parentType === 'chapter' ? template.chapterIds : template.topicIds;
    assert.deepStrictEqual(record.checkedParentIds, parentIds, `${template.id}: parent IDs drifted`);
    assert.ok(Array.isArray(parentIds) && parentIds.length === 1, `${template.id}: exactly one parent required`);
    parentIds.forEach((parentId) => {
      if (parentType === 'chapter') {
        assert.ok(chapters.has(parentId), `${template.id}: unknown chapter ${parentId}`);
      } else {
        assert.ok(topics.has(parentId), `${template.id}: unknown topic ${parentId}`);
        assert.ok(topics.get(parentId).templateIds.includes(template.id), `${template.id}: topic template reference missing`);
      }
    });
    assert.ok(Array.isArray(template.keywords) && template.keywords.length >= 3, `${template.id}: keywords incomplete`);
    assert.ok(Array.isArray(template.cues) && template.cues.length >= 4, `${template.id}: cues incomplete`);
    assert.ok(Array.isArray(template.steps) && template.steps.length >= 4, `${template.id}: steps incomplete`);
    assert.ok(Array.isArray(template.pitfalls) && template.pitfalls.length >= 2, `${template.id}: pitfalls incomplete`);
    assert.ok(template.summary, `${template.id}: summary missing`);
    assert.ok(Array.isArray(runtimeTemplate.examples) && runtimeTemplate.examples.length === 3, `${template.id}: runtime examples must be 3`);
    runtimeTemplate.examples.forEach((example, index) => checkExample(example, template.id, index));
    assert.ok(typeof runtimeTemplate.figure === 'string' && runtimeTemplate.figure, `${template.id}: runtime figure missing`);
    assert.strictEqual(record.runtimeExampleCount, runtimeTemplate.examples.length, `${template.id}: example count drifted`);
    assert.strictEqual(record.figureSource, 'shared-generated-asset', `${template.id}: figure source drifted`);
    assert.strictEqual(record.snapshotHash, buildPhysicsTemplateReviewSnapshot(template, runtimeTemplate).hash, `${template.id}: snapshot drifted`);
    assert.strictEqual(auditTemplates.get(template.id)?.type, auditType, `${template.id}: audit type drifted`);
    assert.strictEqual(auditTemplates.get(template.id)?.reviewed.status, 'verified', `${template.id}: content audit did not receive reviewed metadata`);

    assert.ok(meta, `${template.id}: runtime review metadata missing`);
    assert.strictEqual(meta.status, 'verified', `${template.id}: review status invalid`);
    assert.strictEqual(meta.statusLabel, '已复核', `${template.id}: review status label invalid`);
    assert.strictEqual(meta.reviewedAt, '2026-08-10', `${template.id}: review date invalid`);
    assert.strictEqual(meta.reviewScope, 'stable-method-template', `${template.id}: review scope invalid`);
    assert.strictEqual(meta.reviewBatch, 'v1.10.0', `${template.id}: review batch invalid`);
    assert.strictEqual(meta.parentType, parentType, `${template.id}: metadata parent type invalid`);
    assert.ok(Array.isArray(meta.sourceRefs) && meta.sourceRefs.length === 2, `${template.id}: sources incomplete`);
    meta.sourceRefs.forEach((source) => assertOfficialSource(source, template.id));
    assert.ok(Array.isArray(meta.evidence) && meta.evidence.length >= 3, `${template.id}: evidence incomplete`);
    checkCloneIsolation(template.id);
  });

  assert.strictEqual(getPhysicsTemplateReviewMeta('unknown-template'), null, 'unknown physics template should not be reviewed');
  assert.strictEqual(seen.size, EXPECTED_TEMPLATE_IDS.length, 'reviewed physics template total');
  return seen.size;
}

if (require.main === module) {
  try {
    const count = checkPhysicsTemplateReview();
    console.log(`OK physics template review: ${count} templates`);
  } catch (error) {
    console.error(`FOUND_PHYSICS_TEMPLATE_REVIEW_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_CHAPTER_TEMPLATE_IDS,
  EXPECTED_STRUCTURED_TEMPLATE_IDS,
  EXPECTED_TEMPLATE_IDS,
  checkPhysicsTemplateReview,
};
