const assert = require('assert');

const {
  MATH_CURRICULUM_BASELINE,
} = require('../packages/math/data/math-curriculum-baseline');
const {
  collectMathCurriculumAudit,
} = require('./math-curriculum-audit');
const {
  normalizeMathVolumeMapInput,
} = require('./math-volume-map-input');

const FIELD_DEFINITIONS = [
  ['grade', 'grade'],
  ['volume', 'volume'],
  ['chapterNo', 'chapterNo'],
  ['title', 'title'],
];

function equalValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildEntryDiff(inputEntry, currentEntry) {
  const current = currentEntry ? {
    grade: currentEntry.grade,
    volume: currentEntry.volume,
    chapterNo: currentEntry.chapterNo,
    title: currentEntry.title,
    sections: [...currentEntry.officialSections],
  } : null;
  const official = {
    grade: inputEntry.official.officialGrade,
    volume: inputEntry.official.officialVolume,
    chapterNo: inputEntry.official.officialChapterNo,
    title: inputEntry.official.officialTitle,
    sections: [...inputEntry.official.officialSections],
  };
  const changedFields = [];
  const differences = {};
  FIELD_DEFINITIONS.forEach(([field, key]) => {
    if (!current || !equalValue(current[key], official[key])) {
      changedFields.push(field);
      differences[field] = {
        current: current ? current[key] : null,
        official: official[key],
      };
    }
  });
  const added = current
    ? official.sections.filter((section) => !current.sections.includes(section))
    : [...official.sections];
  const removed = current
    ? current.sections.filter((section) => !official.sections.includes(section))
    : [];
  if (added.length || removed.length) {
    changedFields.push('sections');
    differences.sections = {
      current: current ? [...current.sections] : null,
      official: [...official.sections],
    };
  }
  return {
    stableChapterId: inputEntry.stableChapterId,
    current,
    official,
    changedFields,
    differences,
    sections: { added, removed },
    sourceEvidence: inputEntry.sourceEvidence.map((item) => ({ ...item })),
    stability: { ...inputEntry.legacyAliasImpact },
  };
}

function buildMathVolumeMapDiff(input) {
  const normalized = normalizeMathVolumeMapInput(input);
  const currentAudit = collectMathCurriculumAudit();
  const currentById = new Map(currentAudit.current.chapters.map((chapter) => [chapter.id, chapter]));
  const entries = normalized.entries.map((entry) => buildEntryDiff(entry, currentById.get(entry.stableChapterId)));
  const fieldDifferenceCounts = {
    grade: 0,
    volume: 0,
    chapterNo: 0,
    title: 0,
    sections: 0,
  };
  entries.forEach((entry) => entry.changedFields.forEach((field) => {
    fieldDifferenceCounts[field] += 1;
  }));
  const stability = {
    stableChapterIdsPreserved: entries.every((entry) => entry.stability.stableChapterId === 'unchanged'),
    lessonIdsPreserved: entries.every((entry) => entry.stability.lessonIds === 'unchanged'),
    legacyAliasesPreserved: entries.every((entry) => entry.stability.legacyAliases === 'preserved'),
  };
  assert.strictEqual(entries.length, currentAudit.current.chapterCount, '外部目录条目数量与当前稳定章节数量不一致');
  return {
    schemaVersion: 1,
    reportType: 'math-volume-map-diff',
    status: 'manual-review-required',
    baselineVersion: MATH_CURRICULUM_BASELINE.baselineVersion,
    inputSourceVersion: normalized.sourceVersion,
    inputSourceHash: normalized.sourceHash,
    sourceIds: [...normalized.sourceIds],
    summary: {
      totalEntries: entries.length,
      entriesWithDifferences: entries.filter((entry) => entry.changedFields.length).length,
      manualReviewEntryCount: entries.length,
      fieldDifferenceCounts,
    },
    stability,
    entries,
  };
}

module.exports = {
  buildMathVolumeMapDiff,
};
