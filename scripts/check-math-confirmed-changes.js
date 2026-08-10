const {
  MATH_CURRICULUM_BASELINE,
  STABLE_CHAPTER_IDS,
} = require('../packages/math/data/math-curriculum-baseline');
const { chapterCatalog } = require('../packages/math/data/math-curriculum');
const { lessonFocusMap } = require('../packages/math/data/math-lesson-focus');
const { lessonFormulaMap } = require('../packages/math/data/math-lesson-formulas');
const { lessonFactsMap } = require('../packages/math/data/math-lesson-facts');

const REQUIRED_CONTENT_SIGNALS = Object.freeze({
  'math-function-split': Object.freeze(['19.1 函数', '19.2 一次函数']),
  'math-data-analysis-additions': Object.freeze([
    '20.1 数据的集中趋势',
    '四分位数',
    '分组',
    '20.3 课题学习 体质健康测试中的数据分析',
  ]),
});

function fail(message) {
  throw new Error(`数学官方结构变化覆盖检查：${message}`);
}

function getRuntimeCorpus() {
  return JSON.stringify({
    chapterCatalog,
    lessonFocusMap,
    lessonFormulaMap,
    lessonFactsMap,
  });
}

function getBaselineChanges() {
  if (!Array.isArray(MATH_CURRICULUM_BASELINE.confirmedChanges)
    || MATH_CURRICULUM_BASELINE.confirmedChanges.length !== 2) {
    fail('confirmedChanges 必须包含 2 条官方确认变化');
  }
  return MATH_CURRICULUM_BASELINE.confirmedChanges;
}

function buildConfirmedChangeReport() {
  const corpus = getRuntimeCorpus();
  const changes = getBaselineChanges().map((change) => {
    const requiredSignals = REQUIRED_CONTENT_SIGNALS[change.id];
    if (!requiredSignals) fail(`未登记的结构变化：${change.id}`);
    const foundSignals = requiredSignals.filter((signal) => corpus.includes(signal));
    return {
      id: change.id,
      stableChapterId: change.stableChapterId,
      sourceIds: [...change.sourceIds],
      sourceSignals: [...(change.expectedSignals || change.currentSignals || [])],
      requiredSignals: [...requiredSignals],
      foundSignals,
      coverage: foundSignals.length === requiredSignals.length
        ? 'runtime-content-covered'
        : 'runtime-content-incomplete',
    };
  });
  const report = {
    schemaVersion: 1,
    status: 'covered-but-volume-map-blocked',
    sourceIds: MATH_CURRICULUM_BASELINE.sources.map((source) => source.id),
    changes,
    runtimeGuard: {
      stableChapterCount: STABLE_CHAPTER_IDS.length,
      catalogChapterCount: chapterCatalog.length,
      volumeMapStatus: MATH_CURRICULUM_BASELINE.volumeMap.status,
      officialMappingCount: MATH_CURRICULUM_BASELINE.volumeMap.entries
        .filter((entry) => entry.official !== null).length,
      action: 'keep-runtime-order-and-volume-map-blocked',
    },
  };
  checkConfirmedChangeReport(report);
  return report;
}

function checkConfirmedChangeReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) fail('报告无效');
  if (report.schemaVersion !== 1) fail('schemaVersion 必须为 1');
  if (report.status !== 'covered-but-volume-map-blocked') {
    fail('status 必须为 covered-but-volume-map-blocked');
  }
  const sourceIds = new Set(MATH_CURRICULUM_BASELINE.sources.map((source) => source.id));
  if (!Array.isArray(report.sourceIds) || report.sourceIds.some((id) => !sourceIds.has(id))) {
    fail('sourceIds 必须来自数学课程基线官方来源');
  }
  const changes = getBaselineChanges();
  if (!Array.isArray(report.changes) || report.changes.length !== changes.length) {
    fail('changes 数量必须与基线一致');
  }
  report.changes.forEach((reportChange, index) => {
    const baselineChange = changes[index];
    const requiredSignals = REQUIRED_CONTENT_SIGNALS[baselineChange.id];
    if (!reportChange || reportChange.id !== baselineChange.id
      || reportChange.stableChapterId !== baselineChange.stableChapterId) {
      fail(`changes[${index}] 与基线不一致`);
    }
    if (JSON.stringify(reportChange.sourceIds) !== JSON.stringify(baselineChange.sourceIds)) {
      fail(`${reportChange.id} sourceIds 与基线不一致`);
    }
    const sourceSignals = baselineChange.expectedSignals || baselineChange.currentSignals || [];
    if (JSON.stringify(reportChange.sourceSignals) !== JSON.stringify(sourceSignals)) {
      fail(`${reportChange.id} sourceSignals 与基线不一致`);
    }
    if (JSON.stringify(reportChange.requiredSignals) !== JSON.stringify(requiredSignals)
      || JSON.stringify(reportChange.foundSignals) !== JSON.stringify(requiredSignals)) {
      fail(`${reportChange.id} 信号覆盖不完整`);
    }
    if (reportChange.coverage !== 'runtime-content-covered') {
      fail(`${reportChange.id} 必须标记为 runtime-content-covered`);
    }
  });
  const guard = report.runtimeGuard;
  if (!guard || guard.stableChapterCount !== STABLE_CHAPTER_IDS.length
    || guard.catalogChapterCount !== chapterCatalog.length
    || guard.volumeMapStatus !== 'needs-official-volume-map'
    || guard.officialMappingCount !== 0
    || guard.action !== 'keep-runtime-order-and-volume-map-blocked') {
    fail('runtimeGuard 必须保持稳定章节和新版目录门禁');
  }
  return true;
}

if (require.main === module) {
  try {
    const report = buildConfirmedChangeReport();
    console.log(`OK math confirmed-change coverage: ${report.changes.length} official changes covered; volume map remains blocked`);
  } catch (error) {
    console.error(`FOUND_MATH_CONFIRMED_CHANGE_COVERAGE_ISSUE\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  REQUIRED_CONTENT_SIGNALS,
  buildConfirmedChangeReport,
  checkConfirmedChangeReport,
};
