const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { STABLE_CHAPTER_IDS } = require('../packages/math/data/math-curriculum-baseline');
const { collectMathCurriculumAudit } = require('./math-curriculum-audit');
const { MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION } = require('./math-volume-map-input');
const { buildMathVolumeMapDiff } = require('./math-volume-map-diff');
const {
  hashMathVolumeMapDiff,
  normalizeMathVolumeMapReview,
} = require('./math-volume-map-review');

const SOURCE_IDS = [
  'moe-math-curriculum-2022',
  'moe-textbook-catalog-2024',
  'pep-math-new-textbook-2024',
];

function buildDiff() {
  const currentChapters = collectMathCurriculumAudit().current.chapters;
  const entries = STABLE_CHAPTER_IDS.map((stableChapterId, index) => {
    const chapter = currentChapters.find((item) => item.id === stableChapterId);
    return {
      stableChapterId,
      official: {
        officialGrade: chapter.grade,
        officialVolume: chapter.volume,
        officialChapterNo: chapter.chapterNo,
        officialTitle: chapter.title,
        officialSections: [...chapter.officialSections],
      },
      sourceIds: [...SOURCE_IDS],
      sourceEvidence: SOURCE_IDS.map((sourceId) => ({
        sourceId,
        locator: `官方目录第 ${index + 1} 条定位`,
        scope: '用于核对官方册次、章号、标题和小节，不改变稳定容器。',
      })),
      reviewedAt: '2026-08-10',
      changeReason: '外部官方目录与稳定容器建立证据映射。',
      legacyAliasImpact: {
        stableChapterId: 'unchanged',
        lessonIds: 'unchanged',
        legacyAliases: 'preserved',
        notes: '不改变稳定 ID、lessonId 或历史别名目标。',
      },
    };
  });
  return buildMathVolumeMapDiff({
    schemaVersion: MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION,
    sourceKind: 'external-source',
    sourceVersion: 'math-volume-map-external-review-fixture-v1',
    textbookEdition: '人教版义务教育教科书数学（新版）',
    sourceIds: [...SOURCE_IDS],
    reviewedAt: '2026-08-10',
    entries,
  });
}

function buildValidReview(diff, overrides = {}) {
  return {
    schemaVersion: 1,
    reviewType: 'math-volume-map-review',
    decision: 'approved',
    diffReportHash: hashMathVolumeMapDiff(diff),
    inputSourceHash: diff.inputSourceHash,
    reviewer: 'curriculum-reviewer-fixture',
    reviewedAt: '2026-08-10',
    entries: STABLE_CHAPTER_IDS.map((stableChapterId) => ({
      stableChapterId,
      decision: 'accepted',
      notes: '已核对官方定位、当前容器和稳定迁移约束。',
    })),
    ...overrides,
  };
}

const diff = buildDiff();
const validReview = normalizeMathVolumeMapReview({ diffReport: diff, review: buildValidReview(diff) });
assert.strictEqual(validReview.status, 'approved');
assert.strictEqual(validReview.entries.length, 29);
assert.match(validReview.reviewHash, /^[a-f0-9]{64}$/);
assert.strictEqual(validReview.diffReportHash, hashMathVolumeMapDiff(diff));

const staleHash = buildValidReview(diff, { diffReportHash: '0'.repeat(64) });
assert.throws(() => normalizeMathVolumeMapReview({ diffReport: diff, review: staleHash }), /diffReportHash|差异报告/);

const missingEntry = buildValidReview(diff, {
  entries: buildValidReview(diff).entries.slice(0, -1),
});
assert.throws(() => normalizeMathVolumeMapReview({ diffReport: diff, review: missingEntry }), /29|稳定章节|entries/);

const wrongOrder = buildValidReview(diff, {
  entries: [buildValidReview(diff).entries[1], buildValidReview(diff).entries[0], ...buildValidReview(diff).entries.slice(2)],
});
assert.throws(() => normalizeMathVolumeMapReview({ diffReport: diff, review: wrongOrder }), /顺序|稳定章节/);

const unaccepted = buildValidReview(diff, {
  entries: buildValidReview(diff).entries.map((entry, index) => (
    index === 0 ? { ...entry, decision: 'needs-changes' } : entry
  )),
});
assert.throws(() => normalizeMathVolumeMapReview({ diffReport: diff, review: unaccepted }), /approved|accepted|逐条/);

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-math-volume-map-review-'));
try {
  const diffPath = path.join(tempDirectory, 'diff.json');
  const reviewPath = path.join(tempDirectory, 'review.json');
  const reportPath = path.join(tempDirectory, 'approval.json');
  fs.writeFileSync(diffPath, `${JSON.stringify(diff)}\n`);
  fs.writeFileSync(reviewPath, `${JSON.stringify(buildValidReview(diff))}\n`);
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'check-math-volume-map-review.js'),
    diffPath,
    reviewPath,
    '--report',
    reportPath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /OK math volume map review/);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(reportPath, 'utf8')), validReview);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK math volume map review contract');
