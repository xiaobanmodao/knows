const fs = require('fs');
const path = require('path');

const { getContentSource } = require('../data/content-source-registry');

const EVIDENCE_SCHEMA_VERSION = 1;
const PRODUCT_INDEX_SOURCE_ID = 'pep-math-product-index-2026';
const PRODUCT_INDEX_SOURCE_URL = 'https://www.pep.com.cn/rjyc/kcjc/gjkc/rjbjc/';
const EXPECTED_VOLUME_KEYS = Object.freeze([
  '七年级/上册',
  '七年级/下册',
  '八年级/上册',
  '八年级/下册',
  '九年级/上册',
  '九年级/下册',
]);
const INDEX_LISTED_VOLUME_KEYS = Object.freeze([
  '七年级/上册',
  '七年级/下册',
  '八年级/上册',
  '八年级/下册',
  '九年级/下册',
]);

function fail(message) {
  throw new Error(`数学人教社产品索引证据：${message}`);
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} 必须为非空字符串`);
  return value.trim();
}

function checkEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) fail('证据根对象无效');
  if (evidence.schemaVersion !== EVIDENCE_SCHEMA_VERSION) fail(`schemaVersion 必须为 ${EVIDENCE_SCHEMA_VERSION}`);
  if (evidence.sourceId !== PRODUCT_INDEX_SOURCE_ID) fail('sourceId 不一致');
  const source = getContentSource(PRODUCT_INDEX_SOURCE_ID);
  if (!source || source.kind !== 'official' || source.url !== PRODUCT_INDEX_SOURCE_URL) {
    fail('sourceId 必须解析为已登记的官方来源');
  }
  if (evidence.sourceUrl !== PRODUCT_INDEX_SOURCE_URL) fail('sourceUrl 与来源注册表不一致');
  if (typeof evidence.checkedAt !== 'string' || Number.isNaN(Date.parse(evidence.checkedAt))) {
    fail('checkedAt 无效');
  }
  if (evidence.result !== 'product-index-only') fail('result 必须明确为 product-index-only');
  if (evidence.volumeMapAction !== 'keep-volume-map-blocked') {
    fail('volumeMapAction 必须保持目录门禁');
  }
  requireText(evidence.contentBoundary, 'contentBoundary');

  const indexSummary = evidence.indexSummary;
  if (!indexSummary || typeof indexSummary !== 'object' || Array.isArray(indexSummary)) {
    fail('indexSummary 无效');
  }
  if (indexSummary.sourceUrl !== PRODUCT_INDEX_SOURCE_URL) fail('indexSummary.sourceUrl 不一致');
  if (indexSummary.listedVolumeCount !== INDEX_LISTED_VOLUME_KEYS.length) {
    fail('listedVolumeCount 与官方索引观察不一致');
  }
  if (JSON.stringify(indexSummary.listedVolumeKeys) !== JSON.stringify(INDEX_LISTED_VOLUME_KEYS)) {
    fail('listedVolumeKeys 与官方索引观察不一致');
  }
  if (JSON.stringify(indexSummary.omittedFromIndex) !== JSON.stringify(['九年级/上册'])) {
    fail('omittedFromIndex 必须保留九年级上册缺少索引链接的观察');
  }

  if (!Array.isArray(evidence.entries) || evidence.entries.length !== EXPECTED_VOLUME_KEYS.length) {
    fail('entries 必须覆盖六个数学册次');
  }
  const keys = evidence.entries.map((entry) => entry && entry.key);
  if (JSON.stringify(keys) !== JSON.stringify(EXPECTED_VOLUME_KEYS)) fail('entries 顺序或册次不完整');
  evidence.entries.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail(`entries[${index}] 无效`);
    requireText(entry.grade, `entries[${index}].grade`);
    requireText(entry.volume, `entries[${index}].volume`);
    if (entry.key !== `${entry.grade}/${entry.volume}`) fail(`entries[${index}].key 与年级册次不一致`);
    if (!/^sx[789][sx]$/.test(entry.path)) fail(`entries[${index}].path 无效`);
    if (entry.pageUrl !== `${PRODUCT_INDEX_SOURCE_URL}${entry.path}/`) fail(`entries[${index}].pageUrl 不一致`);
    if (entry.pageStatus !== 200) fail(`entries[${index}] 官方产品页未返回 200`);
    requireText(entry.pageTitle, `entries[${index}].pageTitle`);
    if (typeof entry.listedInIndex !== 'boolean') fail(`entries[${index}].listedInIndex 无效`);
    if (entry.listedInIndex !== INDEX_LISTED_VOLUME_KEYS.includes(entry.key)) {
      fail(`entries[${index}].listedInIndex 与索引观察不一致`);
    }
    if (entry.hasChapterDirectory !== false) {
      fail(`entries[${index}] 不得把产品页误当成章/节目录证据`);
    }
    if (entry.detailLinkState !== 'legacy-or-missing') {
      fail(`entries[${index}].detailLinkState 必须保留旧链接或缺失状态`);
    }
  });
  return true;
}

function readEvidence(inputPath = 'docs/evidence/math-pep-product-index-2026.json') {
  const absolutePath = path.resolve(inputPath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`证据文件读取失败：${absolutePath}：${error.message}`);
  }
}

if (require.main === module) {
  try {
    checkEvidence(readEvidence(process.argv[2]));
    console.log('OK math PEP product index evidence: 6 product pages; volume map remains blocked');
  } catch (error) {
    console.error(`FOUND_MATH_PEP_PRODUCT_INDEX_EVIDENCE_ISSUE\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  EVIDENCE_SCHEMA_VERSION,
  EXPECTED_VOLUME_KEYS,
  INDEX_LISTED_VOLUME_KEYS,
  PRODUCT_INDEX_SOURCE_ID,
  PRODUCT_INDEX_SOURCE_URL,
  checkEvidence,
  readEvidence,
};
