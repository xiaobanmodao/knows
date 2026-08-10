const fs = require('fs');

const { getContentSource } = require('../data/content-source-registry');

const CATALOG_MIRROR_SOURCE_ID = 'moe-textbook-catalog-2024-mirror-shanghai';
const CATALOG_MIRROR_SOURCE_URL = 'https://edu.sh.gov.cn/mbjy_fgwx_qt/20240821/bb17bd928d244286b599eaa826ee5167.html';
const CATALOG_MIRROR_ATTACHMENT_URL = 'https://edu.sh.gov.cn/cmsres/01/01986684fade49c686fcdda5df80cc19/55ec0fda59666ffb41a32c54c646f01b.pdf';

const EXPECTED_MATH_ROW = Object.freeze({
  author: '王长平',
  publisher: '人民教育出版社',
  title: '义务教育教科书•数学',
  volumeRange: '七年级上册至九年级下册',
  gradeRange: '七年级至九年级',
  page: 3,
  textbookKind: '普通学校',
});

function fail(message) {
  throw new Error(`数学教育部目录镜像证据：${message}`);
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} 必须为非空字符串`);
  return value.trim();
}

function checkEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) fail('证据根对象无效');
  if (evidence.schemaVersion !== 1) fail('schemaVersion 必须为 1');
  if (evidence.sourceId !== CATALOG_MIRROR_SOURCE_ID) fail('sourceId 不匹配');
  const source = getContentSource(CATALOG_MIRROR_SOURCE_ID);
  if (!source || source.kind !== 'official' || source.url !== CATALOG_MIRROR_SOURCE_URL) {
    fail('来源必须登记为官方上海市教委页面');
  }
  if (evidence.sourceUrl !== CATALOG_MIRROR_SOURCE_URL) fail('sourceUrl 不匹配');
  if (evidence.attachmentUrl !== CATALOG_MIRROR_ATTACHMENT_URL) fail('attachmentUrl 不匹配');
  if (evidence.result !== 'version-scope-only') fail('result 必须为 version-scope-only');
  if (evidence.chapterDirectoryIncluded !== false) fail('证据不得声称包含章/节目录');
  if (evidence.volumeMapAction !== 'keep-volume-map-blocked') {
    fail('volumeMapAction 必须保持目录门禁');
  }

  const notice = evidence.notice;
  if (!notice || typeof notice !== 'object' || Array.isArray(notice)) fail('notice 无效');
  if (notice.issuingBody !== '教育部办公厅') fail('notice.issuingBody 不匹配');
  if (notice.documentNumber !== '教材厅函〔2024〕7号') fail('notice.documentNumber 不匹配');
  if (notice.publishedAt !== '2024-07-25') fail('notice.publishedAt 不匹配');
  requireText(notice.title, 'notice.title');
  requireText(notice.scope, 'notice.scope');

  if (!Array.isArray(evidence.mathRows) || evidence.mathRows.length !== 1) {
    fail('数学条目必须恰好有 1 条');
  }
  const row = evidence.mathRows[0];
  Object.keys(EXPECTED_MATH_ROW).forEach((key) => {
    if (row[key] !== EXPECTED_MATH_ROW[key]) fail(`数学条目 ${key} 不匹配`);
  });
  if (!evidence.contentBoundary || !evidence.contentBoundary.includes('不确认')) {
    fail('contentBoundary 必须明确不确认逐章映射');
  }
  return true;
}

function readEvidence(inputPath = 'docs/evidence/math-moe-catalog-mirror-2026.json') {
  return JSON.parse(fs.readFileSync(inputPath, 'utf8'));
}

module.exports = {
  CATALOG_MIRROR_SOURCE_ID,
  CATALOG_MIRROR_SOURCE_URL,
  CATALOG_MIRROR_ATTACHMENT_URL,
  EXPECTED_MATH_ROW,
  checkEvidence,
  readEvidence,
};
