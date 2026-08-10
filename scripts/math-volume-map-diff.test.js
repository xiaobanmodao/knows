const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { STABLE_CHAPTER_IDS } = require('../packages/math/data/math-curriculum-baseline');
const { collectMathCurriculumAudit } = require('./math-curriculum-audit');
const {
  MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION,
} = require('./math-volume-map-input');
const { buildMathVolumeMapDiff } = require('./math-volume-map-diff');

const SOURCE_IDS = [
  'moe-math-curriculum-2022',
  'moe-textbook-catalog-2024',
  'pep-math-new-textbook-2024',
];

function buildValidInput(overrides = {}) {
  const currentChapters = collectMathCurriculumAudit().current.chapters;
  return {
    schemaVersion: MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION,
    sourceKind: 'external-source',
    sourceVersion: 'math-volume-map-external-fixture-v2',
    textbookEdition: '人教版义务教育教科书数学（新版）',
    sourceIds: [...SOURCE_IDS],
    reviewedAt: '2026-08-10',
    entries: STABLE_CHAPTER_IDS.map((stableChapterId, index) => {
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
    }),
    ...overrides,
  };
}

const unchanged = buildMathVolumeMapDiff(buildValidInput());
assert.strictEqual(unchanged.schemaVersion, 1);
assert.strictEqual(unchanged.reportType, 'math-volume-map-diff');
assert.strictEqual(unchanged.status, 'manual-review-required');
assert.strictEqual(unchanged.summary.totalEntries, 29);
assert.strictEqual(unchanged.summary.entriesWithDifferences, 0);
assert.deepStrictEqual(unchanged.summary.fieldDifferenceCounts, {
  grade: 0,
  volume: 0,
  chapterNo: 0,
  title: 0,
  sections: 0,
});
assert.strictEqual(unchanged.stability.stableChapterIdsPreserved, true);
assert.strictEqual(unchanged.stability.lessonIdsPreserved, true);
assert.strictEqual(unchanged.stability.legacyAliasesPreserved, true);
assert.deepStrictEqual(unchanged.entries.map((entry) => entry.stableChapterId), STABLE_CHAPTER_IDS);

const changedInput = buildValidInput();
changedInput.entries[0].official.officialVolume = '下册';
changedInput.entries[0].official.officialTitle = '官方新标题';
changedInput.entries[0].official.officialSections.push('新增小节');
const changed = buildMathVolumeMapDiff(changedInput);
assert.strictEqual(changed.summary.entriesWithDifferences, 1);
assert.deepStrictEqual(changed.summary.fieldDifferenceCounts, {
  grade: 0,
  volume: 1,
  chapterNo: 0,
  title: 1,
  sections: 1,
});
assert.deepStrictEqual(changed.entries[0].changedFields, ['volume', 'title', 'sections']);
assert.deepStrictEqual(changed.entries[0].sections.added, ['新增小节']);
assert.deepStrictEqual(changed.entries[0].sections.removed, []);
assert.deepStrictEqual(changed.entries[0].stability, {
  stableChapterId: 'unchanged',
  lessonIds: 'unchanged',
  legacyAliases: 'preserved',
  notes: '不改变稳定 ID、lessonId 或历史别名目标。',
});

assert.throws(
  () => buildMathVolumeMapDiff(buildValidInput({ sourceKind: 'current-fixture' })),
  /sourceKind.*external-source/,
);

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-math-volume-map-diff-'));
try {
  const inputPath = path.join(tempDirectory, 'volume-map.json');
  const reportPath = path.join(tempDirectory, 'diff.json');
  fs.writeFileSync(inputPath, `${JSON.stringify(changedInput)}\n`);
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'build-math-volume-map-diff.js'),
    inputPath,
    '--report',
    reportPath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /OK math volume map diff/);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert.deepStrictEqual(report, changed);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK math volume map diff contract');
