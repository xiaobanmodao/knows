const fs = require('fs');
const path = require('path');

const EXPECTED_CANDIDATE_KEYS = Object.freeze([
  '八年级/上册',
  '八年级/下册',
  '九年级/上册',
  '九年级/下册',
]);
const REQUIRED_TAGS = Object.freeze(['人教版', '初中', '数学']);
const TARGET_GRADES = Object.freeze(['八年级', '九年级']);
const TARGET_VOLUMES = Object.freeze(['上册', '下册']);
const EXCLUDED_TAGS = Object.freeze(['初中（五•四学制）']);
const RESOURCE_PART_ENDPOINT = /^https:\/\/bdcs-file-1\.ykt\.cbern\.com\.cn\/zxx_secondary\/ndrs\/resources\/tch_material\/part_\d+\.json$/;

function fail(message) {
  throw new Error(`数学 SmartEdu 资源候选扫描：${message}`);
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} 必须为非空字符串`);
  return value.trim();
}

function getTagNames(record) {
  return new Set((Array.isArray(record.tag_list) ? record.tag_list : [])
    .map((tag) => (tag && typeof tag.tag_name === 'string' ? tag.tag_name.trim() : ''))
    .filter(Boolean));
}

function getLabel(record) {
  if (Array.isArray(record.label) && typeof record.label[1] === 'string') return record.label[1].trim();
  return '';
}

function normalizeCandidate(record) {
  const tags = getTagNames(record);
  const grade = TARGET_GRADES.find((value) => tags.has(value));
  const volume = TARGET_VOLUMES.find((value) => tags.has(value));
  if (!grade || !volume) fail('候选记录缺少目标年级或册次');
  return {
    key: `${grade}/${volume}`,
    id: requireText(record.id, 'candidate.id'),
    title: requireText(record.title, 'candidate.title'),
    label: getLabel(record),
    grade,
    volume,
    createTime: requireText(record.create_time, 'candidate.createTime'),
    updateTime: requireText(record.update_time, 'candidate.updateTime'),
    onlineTime: requireText(record.online_time, 'candidate.onlineTime'),
  };
}

function discoverCandidates(parts) {
  if (!Array.isArray(parts) || parts.length !== 4) fail('resource parts 必须包含 4 个分片数组');
  const candidates = [];
  parts.flat().forEach((record) => {
    const tags = getTagNames(record);
    if (!REQUIRED_TAGS.every((tag) => tags.has(tag))) return;
    if (EXCLUDED_TAGS.some((tag) => tags.has(tag))) return;
    if (!TARGET_GRADES.some((grade) => tags.has(grade)) || !TARGET_VOLUMES.some((volume) => tags.has(volume))) return;
    candidates.push(normalizeCandidate(record));
  });
  const byKey = new Map();
  candidates.forEach((candidate) => {
    if (byKey.has(candidate.key)) fail(`候选册次重复：${candidate.key}`);
    byKey.set(candidate.key, candidate);
  });
  const ordered = EXPECTED_CANDIDATE_KEYS.map((key) => byKey.get(key));
  if (ordered.some((candidate) => !candidate)) fail(`候选册次不完整：${EXPECTED_CANDIDATE_KEYS.filter((key) => !byKey.has(key)).join(',')}`);
  if (candidates.length !== EXPECTED_CANDIDATE_KEYS.length) fail(`候选数量必须为 ${EXPECTED_CANDIDATE_KEYS.length}`);
  return ordered;
}

function checkReport(evidence, report) {
  if (!evidence || typeof evidence !== 'object' || !evidence.retrieval) fail('证据输入无效');
  if (!report || typeof report !== 'object' || Array.isArray(report)) fail('报告无效');
  if (report.schemaVersion !== 1) fail('schemaVersion 必须为 1');
  if (report.sourceId !== evidence.sourceId) fail('sourceId 与数学目录证据不一致');
  if (!Array.isArray(report.scannedResourceParts)
    || JSON.stringify(report.scannedResourceParts) !== JSON.stringify(evidence.retrieval.resourceParts)) {
    fail('scannedResourceParts 必须与数学目录证据的 resourceParts 一致');
  }
  if (report.scannedResourceParts.some((url) => !RESOURCE_PART_ENDPOINT.test(url))) {
    fail('scannedResourceParts 必须全部来自 SmartEdu 官方资源分片');
  }
  if (!report.filter || JSON.stringify(report.filter.requiredTags) !== JSON.stringify(REQUIRED_TAGS)
    || JSON.stringify(report.filter.targetGrades) !== JSON.stringify(TARGET_GRADES)
    || JSON.stringify(report.filter.targetVolumes) !== JSON.stringify(TARGET_VOLUMES)
    || JSON.stringify(report.filter.excludedTags) !== JSON.stringify(EXCLUDED_TAGS)) {
    fail('报告筛选条件不完整或已改变');
  }
  if (typeof report.checkedAt !== 'string' || Number.isNaN(Date.parse(report.checkedAt))) fail('checkedAt 无效');
  if (report.candidateCount !== EXPECTED_CANDIDATE_KEYS.length) fail('candidateCount 必须为 4');
  if (!Array.isArray(report.candidateKeys)
    || JSON.stringify(report.candidateKeys) !== JSON.stringify(EXPECTED_CANDIDATE_KEYS)) {
    fail('candidateKeys 不符合八上至九下顺序');
  }
  const expectedIds = evidence.resourceRecords
    .filter((record) => EXPECTED_CANDIDATE_KEYS.includes(`${record.grade}/${record.volume}`))
    .map((record) => record.resourceId);
  if (!Array.isArray(report.candidateIds) || JSON.stringify(report.candidateIds) !== JSON.stringify(expectedIds)) {
    fail('candidateIds 与当前数学目录证据不一致');
  }
  if (!Array.isArray(report.candidates) || report.candidates.length !== report.candidateCount) fail('candidates 数量不一致');
  report.candidates.forEach((candidate, index) => {
    if (!candidate || candidate.key !== EXPECTED_CANDIDATE_KEYS[index] || candidate.id !== expectedIds[index]) {
      fail(`candidates[${index}] 与证据顺序不一致`);
    }
    ['title', 'label', 'grade', 'volume', 'createTime', 'updateTime', 'onlineTime'].forEach((field) => {
      requireText(candidate[field], `candidates[${index}].${field}`);
    });
  });
  if (report.result !== 'no-additional-normal-school-candidates') fail('result 必须明确声明未发现额外普通学制候选');
  return true;
}

function buildReport(evidence, candidates, checkedAt = new Date().toISOString()) {
  const report = {
    schemaVersion: 1,
    sourceId: evidence.sourceId,
    scannedResourceParts: [...evidence.retrieval.resourceParts],
    filter: {
      requiredTags: [...REQUIRED_TAGS],
      targetGrades: [...TARGET_GRADES],
      targetVolumes: [...TARGET_VOLUMES],
      excludedTags: [...EXCLUDED_TAGS],
    },
    checkedAt,
    candidateCount: candidates.length,
    candidateKeys: candidates.map((candidate) => candidate.key),
    candidateIds: candidates.map((candidate) => candidate.id),
    candidates,
    result: 'no-additional-normal-school-candidates',
  };
  checkReport(evidence, report);
  return report;
}

async function fetchJson(url, timeoutMs = 15000) {
  if (!RESOURCE_PART_ENDPOINT.test(url)) fail(`资源分片 URL 不属于官方平台：${url}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) fail(`资源分片返回 HTTP ${response.status}：${url}`);
  const value = await response.json();
  if (!Array.isArray(value)) fail(`资源分片不是数组：${url}`);
  return value;
}

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readEvidence(inputPath) {
  const absolutePath = path.resolve(inputPath || 'docs/evidence/math-smartedu-catalog-2026.json');
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

async function main() {
  const evidencePath = getOption('--evidence') || 'docs/evidence/math-smartedu-catalog-2026.json';
  const reportPath = getOption('--report');
  const evidence = readEvidence(evidencePath);
  const parts = await Promise.all(evidence.retrieval.resourceParts.map((url) => fetchJson(url)));
  const report = buildReport(evidence, discoverCandidates(parts));
  if (reportPath) {
    const absoluteReportPath = path.resolve(reportPath);
    fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
    fs.writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Report: ${absoluteReportPath}`);
  }
  console.log(`OK math SmartEdu resource discovery: ${report.candidateCount} normal-school candidates checked; no additional candidates`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`FOUND_MATH_SMARTEDU_RESOURCE_DISCOVERY_ISSUE\n${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  EXCLUDED_TAGS,
  EXPECTED_CANDIDATE_KEYS,
  REQUIRED_TAGS,
  TARGET_GRADES,
  TARGET_VOLUMES,
  buildReport,
  checkReport,
  discoverCandidates,
  fetchJson,
};
