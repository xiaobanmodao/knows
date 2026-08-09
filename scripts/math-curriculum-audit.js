const crypto = require('crypto');

const math = require('../packages/math/repository');
const {
  MATH_CURRICULUM_BASELINE,
  STABLE_CHAPTER_IDS,
} = require('../packages/math/data/math-curriculum-baseline');

const OFFICIAL_HOSTS = new Set(['www.moe.gov.cn', 'moe.gov.cn', 'www.pep.com.cn', 'pep.com.cn']);

function sha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function stableChapterSnapshot(chapter) {
  return {
    id: chapter.id,
    title: chapter.title,
    chapterNo: chapter.chapterNo,
    grade: chapter.grade,
    volume: chapter.volume,
    stage: chapter.stage,
    officialSections: [...(chapter.officialSections || [])],
  };
}

function getCurrentChapters() {
  return math.getAllChapters()
    .map(stableChapterSnapshot)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function buildConfirmedChange(change, chaptersById) {
  const chapter = chaptersById.get(change.stableChapterId);
  const currentSections = chapter ? chapter.officialSections : [];
  const currentSignals = (change.currentSignals || []).filter((signal) => currentSections.includes(signal));
  const expectedSignalsMissing = (change.expectedSignals || []).filter((signal) => !currentSections.includes(signal));
  return {
    ...change,
    currentSignalsPresent: currentSignals,
    expectedSignalsMissing,
    implementationStatus: expectedSignalsMissing.length ? 'pending-section-mapping' : 'mapped-in-stable-container',
  };
}

function collectMathCurriculumAudit() {
  const currentChapters = getCurrentChapters();
  const chaptersById = new Map(currentChapters.map((chapter) => [chapter.id, chapter]));
  const currentIds = new Set(currentChapters.map((chapter) => chapter.id));
  const baselineIds = new Set(STABLE_CHAPTER_IDS);
  const missingStableIds = STABLE_CHAPTER_IDS.filter((id) => !currentIds.has(id));
  const unexpectedStableIds = currentChapters.map((chapter) => chapter.id).filter((id) => !baselineIds.has(id));
  const confirmedChanges = MATH_CURRICULUM_BASELINE.confirmedChanges
    .map((change) => buildConfirmedChange(change, chaptersById));
  const openQuestions = [{
    id: 'math-full-volume-map',
    status: MATH_CURRICULUM_BASELINE.volumeReviewStatus.status,
    reason: MATH_CURRICULUM_BASELINE.volumeReviewStatus.reason,
    blockedActions: [...MATH_CURRICULUM_BASELINE.volumeReviewStatus.blockedActions],
    affectedStableIds: [...STABLE_CHAPTER_IDS],
  }];
  const current = {
    chapterCount: currentChapters.length,
    chapters: currentChapters,
    missingStableIds,
    unexpectedStableIds,
  };
  const hashInput = {
    baselineVersion: MATH_CURRICULUM_BASELINE.baselineVersion,
    stableContainerPolicy: MATH_CURRICULUM_BASELINE.stableContainerPolicy,
    current,
    confirmedChanges,
    openQuestions,
  };
  return {
    schemaVersion: 1,
    baselineVersion: MATH_CURRICULUM_BASELINE.baselineVersion,
    sourceHash: sha256(hashInput),
    sources: MATH_CURRICULUM_BASELINE.sources.map((source) => ({ ...source })),
    current,
    confirmedChanges,
    openQuestions,
  };
}

function checkBaselineContract() {
  if (MATH_CURRICULUM_BASELINE.stableContainerPolicy.currentChapterCount !== STABLE_CHAPTER_IDS.length) {
    throw new Error('数学目录基线稳定章节数量与稳定 ID 数量不一致');
  }
  if (MATH_CURRICULUM_BASELINE.stableContainerPolicy.runtimeChapterOrderIsOfficialNewOrder !== false) {
    throw new Error('数学目录基线不得把当前显示顺序宣称为新版官方章序');
  }

  const sourceIds = new Set();
  MATH_CURRICULUM_BASELINE.sources.forEach((source) => {
    if (!source.id || sourceIds.has(source.id)) throw new Error(`数学目录来源 ID 重复或为空：${source.id}`);
    sourceIds.add(source.id);
    const hostname = new URL(source.url).hostname;
    if (!OFFICIAL_HOSTS.has(hostname)) throw new Error(`数学目录来源域名不受信任：${hostname}`);
  });

  const stableIds = new Set(STABLE_CHAPTER_IDS);
  if (stableIds.size !== STABLE_CHAPTER_IDS.length) throw new Error('数学稳定章节 ID 不得重复');

  const changeIds = new Set();
  const mappedStableIds = new Set();
  MATH_CURRICULUM_BASELINE.confirmedChanges.forEach((change) => {
    if (!change.id || changeIds.has(change.id)) throw new Error(`数学目录变化 ID 重复或为空：${change.id}`);
    changeIds.add(change.id);
    if (!stableIds.has(change.stableChapterId)) throw new Error(`数学目录变化引用未知稳定章节：${change.stableChapterId}`);
    if (mappedStableIds.has(change.stableChapterId)) throw new Error(`数学目录变化重复映射稳定章节：${change.stableChapterId}`);
    mappedStableIds.add(change.stableChapterId);
    if (change.status !== 'confirmed-change' || !change.statement || !change.requiredAction) {
      throw new Error(`数学目录变化缺少确认依据：${change.id}`);
    }
    if (!Array.isArray(change.sourceIds) || !change.sourceIds.length) {
      throw new Error(`数学目录变化缺少来源：${change.id}`);
    }
    if (new Set(change.sourceIds).size !== change.sourceIds.length) {
      throw new Error(`数学目录变化来源重复：${change.id}`);
    }
    change.sourceIds.forEach((sourceId) => {
      if (!sourceIds.has(sourceId)) throw new Error(`数学目录变化引用未知来源：${sourceId}`);
    });
  });

  const volumeReviewStatus = MATH_CURRICULUM_BASELINE.volumeReviewStatus;
  if (volumeReviewStatus.status !== 'needs-official-volume-map') {
    throw new Error('数学目录基线必须保持待官方逐册目录核对状态');
  }
  if (!Array.isArray(volumeReviewStatus.blockedActions) || !volumeReviewStatus.blockedActions.length) {
    throw new Error('数学目录基线必须列出被阻止的重排动作');
  }
}

function checkMathCurriculumAudit(report) {
  checkBaselineContract();
  if (!report || report.schemaVersion !== 1) throw new Error('数学目录审计 schemaVersion 必须为 1');
  if (report.baselineVersion !== MATH_CURRICULUM_BASELINE.baselineVersion) {
    throw new Error('数学目录审计 baselineVersion 不一致');
  }
  if (!Array.isArray(report.sources) || report.sources.length !== 3) {
    throw new Error('数学目录审计必须包含三类官方来源');
  }
  report.sources.forEach((source) => {
    const hostname = new URL(source.url).hostname;
    if (!OFFICIAL_HOSTS.has(hostname)) throw new Error(`数学目录来源域名不受信任：${hostname}`);
  });
  if (JSON.stringify(report.sources) !== JSON.stringify(MATH_CURRICULUM_BASELINE.sources)) {
    throw new Error('数学目录报告来源与基线不一致');
  }
  const expected = collectMathCurriculumAudit();
  if (report.current.chapterCount !== 29) throw new Error(`数学稳定章节数量应为 29，当前 ${report.current.chapterCount}`);
  if (report.current.missingStableIds.length || report.current.unexpectedStableIds.length) {
    throw new Error('数学稳定章节 ID 与目录基线不一致');
  }
  if (JSON.stringify(report.current) !== JSON.stringify(expected.current)) throw new Error('当前数学目录快照不一致');
  const confirmedIds = report.confirmedChanges.map((change) => change.id);
  if (JSON.stringify(confirmedIds) !== JSON.stringify(['math-function-split', 'math-data-analysis-additions'])) {
    throw new Error('已确认数学目录变化集合不完整或顺序不稳定');
  }
  report.confirmedChanges.forEach((change) => {
    if (change.status !== 'confirmed-change' || !change.stableChapterId || !change.sourceIds.length) {
      throw new Error(`数学目录变化记录不完整：${change.id}`);
    }
    if (!STABLE_CHAPTER_IDS.includes(change.stableChapterId)) {
      throw new Error(`数学目录变化引用未知稳定章节：${change.stableChapterId}`);
    }
    if (new Set(change.sourceIds).size !== change.sourceIds.length) {
      throw new Error(`数学目录报告来源重复：${change.id}`);
    }
  });
  if (!report.openQuestions.length || report.openQuestions.some((item) => item.status !== 'needs-official-volume-map')) {
    throw new Error('数学目录开放问题必须保持待官方逐册目录核对状态');
  }
  report.openQuestions.forEach((item) => {
    if ('officialChapterNo' in item || 'officialVolume' in item || 'officialGrade' in item) {
      throw new Error(`数学目录开放问题不得包含未经核对的官方章序字段：${item.id}`);
    }
  });
  if (report.sourceHash !== expected.sourceHash) throw new Error('数学目录审计 sourceHash 与当前内容不一致');
  return true;
}

module.exports = {
  collectMathCurriculumAudit,
  checkMathCurriculumAudit,
};
