const fs = require('fs');
const path = require('path');

const { checkEvidence } = require('./check-math-smartedu-catalog-evidence');

const DETAIL_ENDPOINT = /^https:\/\/bdcs-file-[12]\.ykt\.cbern\.com\.cn\//;
const PREVIEW_ENDPOINT = /^https:\/\/r[123]-ndr\.ykt\.cbern\.com\.cn\//;

function fail(message) {
  throw new Error(`数学官方平台目录在线复核：${message}`);
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
  const markedAsRevised = liveTitle.includes('根据2022年版课程标准修订');
  if ((evidenceRecord.revisionMarker === '2022-revised') !== markedAsRevised) {
    fail(`${evidenceRecord.grade}/${evidenceRecord.volume} revisionMarker 不一致`);
  }
  const preview = getPreviewMap(liveRecord);
  const previewPages = evidenceRecord.directoryPreviewPages;
  if (!Array.isArray(previewPages) || !previewPages.length) fail('本地证据缺少 directoryPreviewPages');
  previewPages.forEach((page) => {
    const key = `Slide${page}`;
    validatePreviewUrl(preview[key], page, `${evidenceRecord.grade}/${evidenceRecord.volume}.${key}`);
  });
  return {
    resourceId: evidenceRecord.resourceId,
    title: liveTitle,
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

async function main() {
  const input = readEvidence(getInputPath());
  const result = await checkLiveEvidence(input, { timeoutMs: Number(getOption('--timeout') || 15000) });
  const reportPath = getOption('--report');
  if (reportPath) {
    const absoluteReportPath = path.resolve(reportPath);
    fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
    fs.writeFileSync(absoluteReportPath, `${JSON.stringify({ ...result, checkedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
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
  checkLiveEvidence,
  fetchJson,
  validateLiveRecord,
};
