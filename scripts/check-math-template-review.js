const assert = require('assert');

const math = require('../packages/math/repository');
const { templateLibrary } = require('../packages/math/data/math-curriculum');
const {
  REVIEWED_MATH_TEMPLATE_IDS,
  TEMPLATE_REVIEW_RECORDS,
  buildTemplateReviewSnapshot,
  getTemplateReviewMeta,
} = require('../packages/math/data/template-review-meta');
const { getContentSource, isAllowedContentSourceUrl } = require('../data/content-source-registry');

const EXPECTED_TEMPLATE_IDS = [
  'model-hand-in-hand',
  'model-general-meets-horse',
  'model-a-similarity',
  'model-k-similarity',
  'model-angle-bisector',
  'model-midpoint',
  'model-square',
  'model-tangent',
  'model-pythagorean-shortest',
  'model-undetermined-coeff',
  'model-completing-square',
  'model-classification',
  'model-function-extreme',
  'model-sine-cosine',
  'model-visualization',
  'model-cross',
  'model-eight-shape',
  'model-dart',
  'model-child-mother',
  'model-k-equal-angle',
  'model-pig-hoof',
  'model-round-helper',
  'model-midline-extension',
  'model-number-line-distance',
  'model-expression-structure',
  'model-linear-equation-scenario',
  'model-line-angle-calculation',
  'model-root-estimation',
  'model-coordinate-translation',
  'model-system-elimination',
  'model-survey-chart',
  'model-factorization',
  'model-fraction-equation',
  'model-radical-operation',
  'model-statistic-selection',
  'model-probability-listing',
];

const SOURCE_KEYS = new Set([
  'moe-math-curriculum-2022',
  'pep-math-new-textbook-2024',
]);

function assertOfficialSource(source, owner) {
  assert.ok(source && source.key && SOURCE_KEYS.has(source.key), `${owner}: source key invalid`);
  assert.ok(source.title, `${owner}: source title missing`);
  const registered = getContentSource(source.key);
  assert.ok(registered && registered.kind === 'official', `${owner}: source kind invalid`);
  assert.strictEqual(registered.url, source.url, `${owner}: source URL drifted`);
  assert.ok(isAllowedContentSourceUrl(registered, source.url), `${owner}: source host invalid`);
}

function assertCloneIsolation(templateId) {
  const first = getTemplateReviewMeta(templateId);
  const second = getTemplateReviewMeta(templateId);
  assert.notStrictEqual(first, second, `${templateId}: metadata object must be cloned`);
  assert.notStrictEqual(first.sourceRefs, second.sourceRefs, `${templateId}: sourceRefs must be cloned`);
  first.sourceRefs[0].title = 'mutated';
  assert.notStrictEqual(getTemplateReviewMeta(templateId).sourceRefs[0].title, 'mutated', `${templateId}: sourceRefs leaked mutation`);
}

function checkMathTemplateReview() {
  assert.deepStrictEqual(REVIEWED_MATH_TEMPLATE_IDS, EXPECTED_TEMPLATE_IDS, 'reviewed template IDs/order drifted');
  assert.strictEqual(templateLibrary.length, 36, 'math template count');
  assert.deepStrictEqual(templateLibrary.map((item) => item.id), EXPECTED_TEMPLATE_IDS, 'templateLibrary IDs/order drifted');
  assert.deepStrictEqual(Object.keys(TEMPLATE_REVIEW_RECORDS), EXPECTED_TEMPLATE_IDS, 'template review records incomplete');

  const chapters = new Map(math.getAllChapters().map((chapter) => [chapter.id, chapter]));
  const seen = new Set();

  for (const template of templateLibrary) {
    assert.ok(!seen.has(template.id), `${template.id}: duplicate template ID`);
    seen.add(template.id);

    const runtimeTemplate = math.getTemplateById('math', template.id);
    assert.ok(runtimeTemplate, `${template.id}: runtime template missing`);
    const record = TEMPLATE_REVIEW_RECORDS[template.id];
    const meta = getTemplateReviewMeta(template.id);

    assert.ok(record, `${template.id}: review record missing`);
    assert.strictEqual(record.checkedTitle, template.name, `${template.id}: title drifted`);
    assert.strictEqual(record.checkedCategory, template.category, `${template.id}: category drifted`);
    assert.deepStrictEqual(record.checkedChapterIds, template.relatedChapters, `${template.id}: parent chapters drifted`);
    assert.ok(Array.isArray(template.relatedChapters) && template.relatedChapters.length >= 1, `${template.id}: parent chapter missing`);
    template.relatedChapters.forEach((chapterId) => assert.ok(chapters.has(chapterId), `${template.id}: unknown parent ${chapterId}`));

    assert.ok(Array.isArray(template.keywords) && template.keywords.length >= 2, `${template.id}: keywords missing`);
    assert.ok(Array.isArray(template.cues) && template.cues.length >= 3, `${template.id}: cues incomplete`);
    assert.ok(Array.isArray(template.steps) && template.steps.length >= 4, `${template.id}: steps incomplete`);
    assert.ok(Array.isArray(template.pitfalls) && template.pitfalls.length >= 2, `${template.id}: pitfalls incomplete`);
    assert.ok(Array.isArray(runtimeTemplate.examples) && runtimeTemplate.examples.length >= 1, `${template.id}: runtime examples missing`);
    runtimeTemplate.examples.forEach((example, index) => {
      assert.ok(example.title && example.stem, `${template.id}: example ${index + 1} missing title/stem`);
      assert.ok(Array.isArray(example.steps) && example.steps.length >= 2, `${template.id}: example ${index + 1} steps incomplete`);
      assert.ok(example.summary, `${template.id}: example ${index + 1} summary missing`);
    });
    assert.ok(typeof runtimeTemplate.figure === 'string' && runtimeTemplate.figure, `${template.id}: runtime figure missing`);

    const snapshot = buildTemplateReviewSnapshot(template, runtimeTemplate);
    assert.strictEqual(record.snapshotHash, snapshot.hash, `${template.id}: snapshot drifted`);
    assert.strictEqual(record.runtimeExampleCount, runtimeTemplate.examples.length, `${template.id}: runtime example count drifted`);
    assert.strictEqual(record.figureSource, template.figurePath ? 'dedicated-asset' : 'shared-generated-asset', `${template.id}: figure source boundary drifted`);

    assert.ok(meta, `${template.id}: runtime review metadata missing`);
    assert.strictEqual(meta.status, 'verified', `${template.id}: review status invalid`);
    assert.strictEqual(meta.statusLabel, '已复核', `${template.id}: review status label invalid`);
    assert.strictEqual(meta.reviewedAt, '2026-08-10', `${template.id}: review date invalid`);
    assert.strictEqual(meta.reviewScope, 'stable-method-template', `${template.id}: review scope invalid`);
    assert.strictEqual(meta.reviewBatch, 'v1.9.6', `${template.id}: review batch invalid`);
    assert.ok(Array.isArray(meta.sourceRefs) && meta.sourceRefs.length === 2, `${template.id}: sources incomplete`);
    meta.sourceRefs.forEach((source) => assertOfficialSource(source, template.id));
    assert.ok(Array.isArray(meta.evidence) && meta.evidence.length >= 3, `${template.id}: evidence incomplete`);
    assertCloneIsolation(template.id);
  }

  assert.strictEqual(getTemplateReviewMeta('unknown-template'), null, 'unknown template should not be reviewed');
  assert.strictEqual(seen.size, 36, 'reviewed template total');
  return seen.size;
}

if (require.main === module) {
  try {
    const count = checkMathTemplateReview();
    console.log(`OK math template review: ${count} templates`);
  } catch (error) {
    console.error(`FOUND_MATH_TEMPLATE_REVIEW_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_TEMPLATE_IDS,
  checkMathTemplateReview,
};
