const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const { checkEvidence } = require('./check-math-smartedu-catalog-evidence');

const DETAIL_ENDPOINT = /^https:\/\/bdcs-file-[12]\.ykt\.cbern\.com\.cn\//;
const PREVIEW_ENDPOINT = /^https:\/\/r[123]-ndr\.ykt\.cbern\.com\.cn\//;
const LIVE_REPORT_SCHEMA_VERSION = 2;

function fail(message) {
  throw new Error(`数学官方平台目录在线复核：${message}`);
}

function sha256File(filePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch (error) {
    fail(`证据文件哈希计算失败：${filePath}：${error.message}`);
  }
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} 必须为非空字符串`);
  return value.trim();
}

function getLiveTitle(liveRecord) {
  if (typeof liveRecord.title === 'string') return liveRecord.title;
  if (liveRecord.global_title && typeof liveRecord.global_title['zh-CN'] === 'string') {
    return liveRecord.global_title['zh-CN'];
  }
  fail('远程详情缺少 title/global_title.zh-CN');
}

function getTagNames(liveRecord) {
  if (!Array.isArray(liveRecord.tag_list)) fail('远程详情缺少 tag_list');
  return liveRecord.tag_list
    .map((tag) => (tag && typeof tag.tag_name === 'string' ? tag.tag_name.trim() : ''))
    .filter(Boolean);
}

function getPreviewMap(liveRecord) {
  const preview = liveRecord.custom_properties && liveRecord.custom_properties.preview;
  if (!preview || typeof preview !== 'object' || Array.isArray(preview)) {
    fail('远程详情缺少 custom_properties.preview');
  }
  return preview;
}

function getVersionVisible(liveRecord) {
  const container = liveRecord.resource_container_cp;
  return container && typeof container.version_visible === 'string'
    ? container.version_visible.trim()
    : '';
}

function getFormat(liveRecord) {
  const properties = liveRecord.custom_properties;
  return properties && typeof properties.format === 'string' ? properties.format.trim() : '';
}

function getRevisionMarker(liveRecord) {
  const title = getLiveTitle(liveRecord);
  return title.includes('根据2022年版课程标准修订') ? '2022-revised' : 'unmarked-edition';
}

function validatePreviewUrl(url, page, field) {
  const previewUrl = requireText(url, field);
  if (!PREVIEW_ENDPOINT.test(previewUrl)) fail(`${field} 不属于官方预览域名`);
  let parsed;
  try {
    parsed = new URL(previewUrl);
  } catch (error) {
    fail(`${field} URL 无效`);
  }
  if (!parsed.pathname.endsWith(`/${page}.jpg`)) fail(`${field} 未指向目录页 ${page}`);
  return previewUrl;
}

function validateDetailMetadata(evidenceRecord, liveRecord, preview) {
  const expected = evidenceRecord.detailMetadata;
  if (!expected) return;
  const liveTitle = getLiveTitle(liveRecord);
  if (liveTitle !== expected.globalTitle) {
    fail(`${evidenceRecord.grade}/${evidenceRecord.volume} detailMetadata.globalTitle 不一致`);
  }
  if (getVersionVisible(liveRecord) !== expected.versionVisible) {
    fail(`${evidenceRecord.grade}/${evidenceRecord.volume} detailMetadata.versionVisible 不一致`);
  }
  if (getFormat(liveRecord) !== expected.format) {
    fail(`${evidenceRecord.grade}/${evidenceRecord.volume} detailMetadata.format 不一致`);
  }
  if (Object.keys(preview).length !== expected.previewAssetCount) {
    fail(`${evidenceRecord.grade}/${evidenceRecord.volume} detailMetadata.previewAssetCount 不一致`);
  }
}

function validateLiveRecord(evidenceRecord, liveRecord) {
  if (!evidenceRecord || typeof evidenceRecord !== 'object') fail('本地证据记录无效');
  if (!liveRecord || typeof liveRecord !== 'object' || Array.isArray(liveRecord)) fail('远程详情无效');
  if (liveRecord.id !== evidenceRecord.resourceId) {
    fail(`${evidenceRecord.grade}/${evidenceRecord.volume} resourceId 不一致`);
  }
  const liveTitle = getLiveTitle(liveRecord);
  if (liveTitle !== evidenceRecord.title) {
    fail(`${evidenceRecord.grade}/${evidenceRecord.volume} title 不一致`);
  }
  const tagNames = new Set(getTagNames(liveRecord));
  ['人教版', '初中', '数学', evidenceRecord.grade, evidenceRecord.volume].forEach((tag) => {
    if (!tagNames.has(tag)) fail(`${evidenceRecord.grade}/${evidenceRecord.volume} 缺少标签：${tag}`);
  });
  const revisionMarker = getRevisionMarker(liveRecord);
  if (evidenceRecord.revisionMarker !== revisionMarker) {
    fail(`${evidenceRecord.grade}/${evidenceRecord.volume} revisionMarker 不一致`);
  }
  const preview = getPreviewMap(liveRecord);
  const previewPages = evidenceRecord.directoryPreviewPages;
  if (!Array.isArray(previewPages) || !previewPages.length) fail('本地证据缺少 directoryPreviewPages');
  previewPages.forEach((page) => {
    const key = `Slide${page}`;
    validatePreviewUrl(preview[key], page, `${evidenceRecord.grade}/${evidenceRecord.volume}.${key}`);
  });
  validateDetailMetadata(evidenceRecord, liveRecord, preview);
  return {
    resourceId: evidenceRecord.resourceId,
    title: liveTitle,
    tagNames: [...tagNames],
    revisionMarker,
    previewPages: [...previewPages],
  };
}

async function fetchJson(url, timeoutMs = 15000) {
  if (!DETAIL_ENDPOINT.test(url)) fail(`详情 URL 不属于官方平台域名：${url}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) fail(`详情 URL 返回 HTTP ${response.status}：${url}`);
  try {
    return await response.json();
  } catch (error) {
    fail(`详情 URL 返回内容不是 JSON：${url}`);
  }
}

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getInputPath() {
  const optionNames = new Set(['--timeout', '--report']);
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (optionNames.has(arg)) {
      index += 1;
      continue;
    }
    if (!arg.startsWith('--')) return arg;
  }
  return undefined;
}

function readEvidence(inputPath) {
  const absolutePath = path.resolve(inputPath || 'docs/evidence/math-smartedu-catalog-2026.json');
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`证据文件读取失败：${absolutePath}：${error.message}`);
  }
}

async function checkLiveEvidence(input, { timeoutMs = 15000 } = {}) {
  checkEvidence(input);
  const records = await Promise.all(input.resourceRecords.map(async (record) => {
    const detailUrl = input.retrieval.detailUrlTemplate.replace('{resourceId}', record.resourceId);
    const liveRecord = await fetchJson(detailUrl, timeoutMs);
    return validateLiveRecord(record, liveRecord);
  }));
  return {
    sourceId: input.sourceId,
    records,
  };
}

function checkLiveReport(input, report, { evidenceSha256 } = {}) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.resourceRecords)) {
    fail('离线报告对应的本地证据无效');
  }
  if (!report || typeof report !== 'object' || Array.isArray(report)) fail('离线报告无效');
  if (report.schemaVersion !== LIVE_REPORT_SCHEMA_VERSION) {
    fail(`离线报告 schemaVersion 必须为 ${LIVE_REPORT_SCHEMA_VERSION}`);
  }
  if (report.sourceId !== input.sourceId) fail('离线报告 sourceId 与本地证据不一致');
  if (!/^[a-f0-9]{64}$/.test(report.evidenceSha256)) fail('离线报告 evidenceSha256 无效');
  if (evidenceSha256 && report.evidenceSha256 !== evidenceSha256) {
    fail('离线报告 evidenceSha256 与当前证据文件不一致');
  }
  if (typeof report.checkedAt !== 'string' || Number.isNaN(Date.parse(report.checkedAt))) {
    fail('离线报告 checkedAt 无效');
  }
  if (!Array.isArray(report.records) || report.records.length !== input.resourceRecords.length) {
    fail('离线报告 records 数量与本地证据不一致');
  }
  const evidenceById = new Map(input.resourceRecords.map((record) => [record.resourceId, record]));
  const reportIds = new Set();
  report.records.forEach((record) => {
    if (!record || typeof record !== 'object' || !record.resourceId) fail('离线报告记录不完整');
    if (reportIds.has(record.resourceId)) fail(`离线报告重复 resourceId：${record.resourceId}`);
    reportIds.add(record.resourceId);
    const evidenceRecord = evidenceById.get(record.resourceId);
    if (!evidenceRecord) fail(`离线报告包含未知 resourceId：${record.resourceId}`);
    if (record.title !== evidenceRecord.title) fail(`${record.resourceId} 离线报告 title 不一致`);
    if (!Array.isArray(record.tagNames) || !record.tagNames.length
      || record.tagNames.some((tag) => typeof tag !== 'string' || !tag.trim())) {
      fail(`${record.resourceId} 离线报告 tagNames 不完整`);
    }
    const requiredTags = ['人教版', '初中', '数学', evidenceRecord.grade, evidenceRecord.volume];
    if (requiredTags.some((tag) => !record.tagNames.includes(tag))) {
      fail(`${record.resourceId} 离线报告缺少必需标签`);
    }
    if (record.revisionMarker !== evidenceRecord.revisionMarker) {
      fail(`${record.resourceId} 离线报告 revisionMarker 不一致`);
    }
    if (JSON.stringify(record.previewPages) !== JSON.stringify(evidenceRecord.directoryPreviewPages)) {
      fail(`${record.resourceId} 离线报告 previewPages 不一致`);
    }
  });
  return true;
}

function buildLiveReport(input, evidencePath, result, checkedAt = new Date().toISOString()) {
  const report = {
    schemaVersion: LIVE_REPORT_SCHEMA_VERSION,
    sourceId: result.sourceId,
    evidenceSha256: sha256File(evidencePath),
    checkedAt,
    records: result.records,
  };
  checkLiveReport(input, report, { evidenceSha256: report.evidenceSha256 });
  return report;
}

async function main() {
  const evidencePath = path.resolve(getInputPath() || 'docs/evidence/math-smartedu-catalog-2026.json');
  const input = readEvidence(evidencePath);
  const result = await checkLiveEvidence(input, { timeoutMs: Number(getOption('--timeout') || 15000) });
  const reportPath = getOption('--report');
  if (reportPath) {
    const report = buildLiveReport(input, evidencePath, result);
    const absoluteReportPath = path.resolve(reportPath);
    fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
    fs.writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Report: ${absoluteReportPath}`);
  }
  console.log(`OK math SmartEdu live evidence: ${result.records.length} volumes and ${result.records.reduce((sum, record) => sum + record.previewPages.length, 0)} directory pages checked`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`FOUND_MATH_SMARTEDU_LIVE_EVIDENCE_ISSUE\n${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  buildLiveReport,
  checkLiveEvidence,
  checkLiveReport,
  fetchJson,
  sha256File,
  validateLiveRecord,
};
