const fs = require('fs');
const path = require('path');

const { getContentSource, isAllowedContentSourceUrl } = require('../data/content-source-registry');

const SOURCE_ID = 'smartedu-math-textbook-catalog-2026';
const EXPECTED_VOLUMES = [
  ['七年级', '上册'],
  ['七年级', '下册'],
  ['八年级', '上册'],
  ['八年级', '下册'],
  ['九年级', '上册'],
  ['九年级', '下册'],
];
const ALLOWED_RECORD_FIELDS = new Set([
  'grade',
  'volume',
  'resourceId',
  'title',
  'revisionMarker',
  'directoryChapterRange',
  'directoryPreviewPages',
  'previewPageUrlTemplate',
]);
const PLATFORM_ENDPOINT = /^https:\/\/bdcs-file-[12]\.ykt\.cbern\.com\.cn\//;
const PREVIEW_ENDPOINT = /^https:\/\/r[123]-ndr\.ykt\.cbern\.com\.cn\//;

function fail(message) {
  throw new Error(`数学官方平台目录证据：${message}`);
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} 必须为非空字符串`);
  return value.trim();
}

function checkUrl(value, field, pattern) {
  const url = requireText(value, field);
  if (!pattern.test(url)) fail(`${field} URL 不属于已核对的官方平台域名`);
  return url;
}

function checkRecord(record, index) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) fail(`第 ${index + 1} 册记录无效`);
  Object.keys(record).forEach((field) => {
    if (!ALLOWED_RECORD_FIELDS.has(field)) fail(`第 ${index + 1} 册记录包含未知字段：${field}`);
  });
  const grade = requireText(record.grade, `第 ${index + 1} 册 grade`);
  const volume = requireText(record.volume, `第 ${index + 1} 册 volume`);
  requireText(record.resourceId, `第 ${index + 1} 册 resourceId`);
  requireText(record.title, `第 ${index + 1} 册 title`);
  const revisionMarker = requireText(record.revisionMarker, `第 ${index + 1} 册 revisionMarker`);
  if (!['2022-revised', 'unmarked-edition'].includes(revisionMarker)) {
    fail(`第 ${index + 1} 册 revisionMarker 无效：${revisionMarker}`);
  }
  requireText(record.directoryChapterRange, `第 ${index + 1} 册 directoryChapterRange`);
  if (!Array.isArray(record.directoryPreviewPages) || !record.directoryPreviewPages.length) {
    fail(`第 ${index + 1} 册 directoryPreviewPages 必须为非空数组`);
  }
  if (record.directoryPreviewPages.some((page) => !Number.isInteger(page) || page < 1 || page > 49)) {
    fail(`第 ${index + 1} 册 directoryPreviewPages 必须是 1-49 的整数`);
  }
  const previewUrl = checkUrl(record.previewPageUrlTemplate, `第 ${index + 1} 册 previewPageUrlTemplate`, PREVIEW_ENDPOINT);
  if (!previewUrl.includes('{page}')) fail(`第 ${index + 1} 册预览 URL 缺少 {page} 占位符`);
  return { grade, volume, resourceId: record.resourceId, revisionMarker };
}

function readInput(inputPath) {
  const absolutePath = path.resolve(inputPath || 'docs/evidence/math-smartedu-catalog-2026.json');
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(`数学官方平台目录证据读取失败：${absolutePath}：${error.message}`);
  }
}

function checkEvidence(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('根对象无效');
  if (input.schemaVersion !== 1) fail('schemaVersion 必须为 1');
  if (input.sourceId !== SOURCE_ID) fail(`sourceId 必须为 ${SOURCE_ID}`);
  const source = getContentSource(SOURCE_ID);
  if (!source || source.kind !== 'official') fail('来源未登记为官方来源');
  if (input.sourceUrl !== source.url || !isAllowedContentSourceUrl(source, input.sourceUrl)) {
    fail('sourceUrl 必须与来源注册表一致');
  }
  if (Number.isNaN(Date.parse(requireText(input.reviewedAt, 'reviewedAt')))) fail('reviewedAt 日期无效');
  if (input.sourceKind !== 'official-catalog-index') fail('sourceKind 无效');
  if (!input.retrieval || typeof input.retrieval !== 'object') fail('retrieval 必须为对象');
  checkUrl(input.retrieval.tagManifestUrl, 'retrieval.tagManifestUrl', PLATFORM_ENDPOINT);
  checkUrl(input.retrieval.versionManifestUrl, 'retrieval.versionManifestUrl', PLATFORM_ENDPOINT);
  if (!Array.isArray(input.retrieval.resourceParts) || input.retrieval.resourceParts.length !== 4) {
    fail('retrieval.resourceParts 必须包含 4 个分片');
  }
  input.retrieval.resourceParts.forEach((url, index) => checkUrl(url, `retrieval.resourceParts[${index}]`, PLATFORM_ENDPOINT));
  if (!requireText(input.retrieval.detailUrlTemplate, 'retrieval.detailUrlTemplate').includes('{resourceId}')) {
    fail('retrieval.detailUrlTemplate 缺少 {resourceId} 占位符');
  }
  if (!Array.isArray(input.resourceRecords) || input.resourceRecords.length !== EXPECTED_VOLUMES.length) {
    fail(`resourceRecords 必须包含 ${EXPECTED_VOLUMES.length} 册`);
  }
  const records = input.resourceRecords.map(checkRecord);
  const keys = records.map((record) => `${record.grade}/${record.volume}`);
  if (new Set(keys).size !== keys.length) fail('年级和册次组合不得重复');
  if (JSON.stringify(keys) !== JSON.stringify(EXPECTED_VOLUMES.map(([grade, volume]) => `${grade}/${volume}`))) {
    fail('resourceRecords 必须按七上至九下顺序排列');
  }
  if (new Set(records.map((record) => record.resourceId)).size !== records.length) fail('resourceId 不得重复');
  const revisedCount = records.filter((record) => record.revisionMarker === '2022-revised').length;
  if (revisedCount !== 2) fail('2022-revised 资源数量必须为 2');
  if (records.filter((record) => record.revisionMarker === 'unmarked-edition').length !== 4) {
    fail('unmarked-edition 资源数量必须为 4');
  }
  const decision = input.reviewDecision;
  if (!decision || decision.catalogStatus !== 'official-records-found') fail('catalogStatus 必须声明官方资源已获取');
  if (decision.volumeMapStatus !== 'blocked-version-inconsistent') fail('volumeMapStatus 必须保留版本不一致阻塞');
  return records;
}

function main() {
  const records = checkEvidence(readInput(process.argv[2]));
  console.log(`OK math SmartEdu catalog evidence: ${records.length} volumes; version gate blocked`);
}

try {
  main();
} catch (error) {
  console.error(`FOUND_MATH_SMARTEDU_CATALOG_EVIDENCE_ISSUE\n${error.message}`);
  process.exitCode = 1;
}

module.exports = { checkEvidence };
