const fs = require('fs');
const path = require('path');

const { checkEvidence } = require('./check-math-smartedu-catalog-evidence');

const TARGET_VOLUME_KEYS = Object.freeze([
  '八年级/上册',
  '八年级/下册',
  '九年级/上册',
  '九年级/下册',
]);
const PREVIEW_ENDPOINT = /^https:\/\/r[123]-ndr\.ykt\.cbern\.com\.cn\//;
const EXPECTED_OBSERVATIONS = Object.freeze({
  '八年级/上册': [
    { page: 1, signal: 'cover-approval', value: '2013' },
    { page: 4, signal: 'curriculum-standard', value: '2011' },
  ],
  '八年级/下册': [
    { page: 1, signal: 'cover-approval', value: '2013' },
    { page: 4, signal: 'curriculum-standard', value: '2011' },
  ],
  '九年级/上册': [
    { page: 1, signal: 'cover-approval', value: '2013' },
    { page: 4, signal: 'curriculum-standard', value: '2011' },
  ],
  '九年级/下册': [
    { page: 1, signal: 'cover-approval', value: '2013' },
  ],
});

function fail(message) {
  throw new Error(`数学 SmartEdu 版本预览证据：${message}`);
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} 必须为非空字符串`);
  return value.trim();
}

function requireDate(value, field) {
  requireText(value, field);
  if (Number.isNaN(Date.parse(value))) fail(`${field} 日期无效`);
}

function getTargetRecords(evidence) {
  const records = new Map((evidence.resourceRecords || []).map((record) => [
    `${record.grade}/${record.volume}`,
    record,
  ]));
  const missing = TARGET_VOLUME_KEYS.filter((key) => !records.has(key));
  if (missing.length) fail(`缺少目标册次：${missing.join(',')}`);
  return TARGET_VOLUME_KEYS.map((key) => records.get(key));
}

function getPreviewUrl(record, page) {
  const url = requireText(
    record.previewPageUrlTemplate.replace('{page}', String(page)),
    `${record.grade}/${record.volume} page ${page} URL`,
  );
  if (!PREVIEW_ENDPOINT.test(url)) fail(`${record.grade}/${record.volume} 预览 URL 不属于官方域名`);
  return url;
}

function buildRecord(record) {
  const key = `${record.grade}/${record.volume}`;
  const expected = EXPECTED_OBSERVATIONS[key];
  if (!expected) fail(`未登记的目标册次：${key}`);
  return {
    grade: record.grade,
    volume: record.volume,
    resourceId: record.resourceId,
    observations: expected.map((item) => ({
      ...item,
      sourceUrl: getPreviewUrl(record, item.page),
      reviewMethod: 'manual-preview-inspection',
    })),
  };
}

function getObservationShape(record) {
  return record.observations.map((item) => ({
    page: item.page,
    signal: item.signal,
    value: item.value,
  }));
}

function checkReport(evidence, report) {
  checkEvidence(evidence);
  if (!report || typeof report !== 'object' || Array.isArray(report)) fail('报告无效');
  if (report.schemaVersion !== 1) fail('schemaVersion 必须为 1');
  if (report.sourceId !== evidence.sourceId) fail('sourceId 与数学目录证据不一致');
  requireDate(report.checkedAt, 'checkedAt');
  if (report.reviewMethod !== 'manual-preview-inspection') fail('reviewMethod 必须为 manual-preview-inspection');
  if (!Array.isArray(report.records) || report.records.length !== TARGET_VOLUME_KEYS.length) {
    fail(`records 必须包含 ${TARGET_VOLUME_KEYS.length} 册`);
  }

  const evidenceRecords = new Map(evidence.resourceRecords.map((record) => [
    `${record.grade}/${record.volume}`,
    record,
  ]));
  const keys = report.records.map((record) => `${record.grade}/${record.volume}`);
  if (JSON.stringify(keys) !== JSON.stringify(TARGET_VOLUME_KEYS)) fail('records 必须按八上至九下顺序排列');
  report.records.forEach((record, index) => {
    const key = TARGET_VOLUME_KEYS[index];
    const evidenceRecord = evidenceRecords.get(key);
    if (!record || record.resourceId !== evidenceRecord.resourceId) {
      fail(`${key} resourceId 与数学目录证据不一致`);
    }
    const expected = EXPECTED_OBSERVATIONS[key];
    if (!Array.isArray(record.observations) || record.observations.length !== expected.length) {
      fail(`${key} observations 数量不一致`);
    }
    if (JSON.stringify(getObservationShape(record)) !== JSON.stringify(expected)) {
      fail(`${key} 预览页版本信号不符合已核对结果`);
    }
    record.observations.forEach((observation, observationIndex) => {
      if (observation.reviewMethod !== 'manual-preview-inspection') {
        fail(`${key} observation[${observationIndex}] reviewMethod 无效`);
      }
      if (observation.sourceUrl !== getPreviewUrl(evidenceRecord, expected[observationIndex].page)) {
        fail(`${key} observation[${observationIndex}] sourceUrl 不一致`);
      }
    });
  });

  const gate = report.editionGate;
  if (!gate || typeof gate !== 'object' || Array.isArray(gate)) fail('editionGate 不完整');
  if (gate.expectedMarker !== '2022-revised') fail('editionGate.expectedMarker 无效');
  if (gate.status !== 'blocked-version-inconsistent') fail('editionGate.status 必须保留版本阻塞');
  if (gate.result !== 'no-2022-revised-marker') fail('editionGate.result 必须保留未发现新版标识结论');
  if (!Array.isArray(gate.observedSignals)
    || JSON.stringify(gate.observedSignals) !== JSON.stringify([
      { signal: 'cover-approval', value: '2013', recordCount: 4 },
      { signal: 'curriculum-standard', value: '2011', recordCount: 3 },
    ])) {
    fail('editionGate.observedSignals 不符合预览页核对结果');
  }
  if (gate.runtimeAction !== 'keep-volume-map-blocked') fail('editionGate.runtimeAction 不得解除目录门禁');
  return true;
}

function buildReport(evidence, checkedAt = new Date().toISOString()) {
  checkEvidence(evidence);
  const records = getTargetRecords(evidence).map(buildRecord);
  const report = {
    schemaVersion: 1,
    sourceId: evidence.sourceId,
    checkedAt,
    reviewMethod: 'manual-preview-inspection',
    scope: 'SmartEdu 人教版初中数学八至九年级册次预览页封面、版权页和本册导引',
    records,
    editionGate: {
      expectedMarker: '2022-revised',
      status: 'blocked-version-inconsistent',
      result: 'no-2022-revised-marker',
      observedSignals: [
        { signal: 'cover-approval', value: '2013', recordCount: 4 },
        { signal: 'curriculum-standard', value: '2011', recordCount: 3 },
      ],
      runtimeAction: 'keep-volume-map-blocked',
    },
  };
  checkReport(evidence, report);
  return report;
}

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(inputPath, label) {
  const absolutePath = path.resolve(inputPath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`${label}读取失败：${absolutePath}：${error.message}`);
  }
}

function main() {
  const evidencePath = getOption('--evidence') || 'docs/evidence/math-smartedu-catalog-2026.json';
  const reportPath = getOption('--report');
  const evidence = readJson(evidencePath, '数学目录证据');
  const report = buildReport(evidence);
  if (reportPath) {
    const absolutePath = path.resolve(reportPath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Report: ${absolutePath}`);
  }
  console.log('OK math SmartEdu edition evidence: 4 preview records; 2011 legacy signals preserved; version gate blocked');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FOUND_MATH_SMARTEDU_EDITION_EVIDENCE_ISSUE\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_OBSERVATIONS,
  TARGET_VOLUME_KEYS,
  buildReport,
  checkReport,
};
