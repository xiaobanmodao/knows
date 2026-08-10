const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { STABLE_CHAPTER_IDS } = require('../packages/math/data/math-curriculum-baseline');
const {
  MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION,
  normalizeMathVolumeMapInput,
  checkMathVolumeMapInput,
} = require('./math-volume-map-input');

const SOURCE_IDS = [
  'moe-math-curriculum-2022',
  'moe-textbook-catalog-2024',
  'pep-math-new-textbook-2024',
];

function buildValidInput(overrides = {}) {
  return {
    schemaVersion: MATH_VOLUME_MAP_INPUT_SCHEMA_VERSION,
    sourceKind: 'external-source',
    sourceVersion: 'math-volume-map-external-fixture-v1',
    textbookEdition: '人教版义务教育教科书数学（新版）',
    sourceIds: [...SOURCE_IDS],
    reviewedAt: '2026-08-10',
    entries: STABLE_CHAPTER_IDS.map((stableChapterId, index) => ({
      stableChapterId,
      official: {
        officialGrade: '七年级',
        officialVolume: '上册',
        officialChapterNo: String(index + 1),
        officialTitle: `官方章节 ${index + 1}`,
        officialSections: [`官方小节 ${index + 1}.1`],
      },
      sourceIds: [...SOURCE_IDS],
      sourceEvidence: SOURCE_IDS.map((sourceId) => ({
        sourceId,
        locator: `第 ${index + 1} 章目录定位`,
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
    })),
    ...overrides,
  };
}

const valid = normalizeMathVolumeMapInput(buildValidInput());
assert.strictEqual(valid.schemaVersion, 1);
assert.strictEqual(valid.entries.length, 29);
assert.deepStrictEqual(valid.entries.map((entry) => entry.stableChapterId), STABLE_CHAPTER_IDS);
assert.match(valid.sourceHash, /^[a-f0-9]{64}$/);
assert.strictEqual(checkMathVolumeMapInput(valid), true);

const duplicate = buildValidInput({
  entries: [buildValidInput().entries[0], ...buildValidInput().entries],
});
assert.throws(() => normalizeMathVolumeMapInput(duplicate), /29|重复|稳定章节/);

const unknownId = buildValidInput({
  entries: buildValidInput().entries.map((entry, index) => (
    index === 0 ? { ...entry, stableChapterId: 'ch99-unknown' } : entry
  )),
});
assert.throws(() => normalizeMathVolumeMapInput(unknownId), /稳定章节 ID|未知/);

const placeholder = buildValidInput({
  entries: buildValidInput().entries.map((entry, index) => (
    index === 0
      ? { ...entry, official: { ...entry.official, officialTitle: '待核对' } }
      : entry
  )),
});
assert.throws(() => normalizeMathVolumeMapInput(placeholder), /占位|官方标题/);

const unrelatedSource = buildValidInput({
  sourceIds: ['moe-physics-2022', ...SOURCE_IDS.slice(1)],
  entries: buildValidInput().entries.map((entry) => ({
    ...entry,
    sourceIds: ['moe-physics-2022', ...SOURCE_IDS.slice(1)],
  })),
});
assert.throws(() => normalizeMathVolumeMapInput(unrelatedSource), /数学目录基线来源|数学来源/);

const changedAliases = buildValidInput({
  entries: buildValidInput().entries.map((entry, index) => (
    index === 0
      ? { ...entry, legacyAliasImpact: { ...entry.legacyAliasImpact, legacyAliases: 'deleted' } }
      : entry
  )),
});
assert.throws(() => normalizeMathVolumeMapInput(changedAliases), /旧别名|legacyAliases|preserved/);

const missingEvidence = buildValidInput({
  entries: buildValidInput().entries.map((entry, index) => (
    index === 0 ? { ...entry, sourceEvidence: [] } : entry
  )),
});
assert.throws(() => normalizeMathVolumeMapInput(missingEvidence), /sourceEvidence|证据/);

const mismatchedEvidence = buildValidInput({
  entries: buildValidInput().entries.map((entry, index) => (
    index === 0
      ? { ...entry, sourceEvidence: [entry.sourceEvidence[0]] }
      : entry
  )),
});
assert.throws(() => normalizeMathVolumeMapInput(mismatchedEvidence), /sourceEvidence|sourceIds|证据/);

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-math-volume-map-'));
try {
  const inputPath = path.join(tempDirectory, 'volume-map.json');
  const reportPath = path.join(tempDirectory, 'report.json');
  fs.writeFileSync(inputPath, `${JSON.stringify(buildValidInput())}\n`);
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'check-math-volume-map-input.js'),
    inputPath,
    '--report',
    reportPath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /OK math volume map input/);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert.deepStrictEqual(report, valid);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK math volume map input contract');
