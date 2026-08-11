const crypto = require('crypto');

const { CLOUD_ENV_ID, REMOTE_ASSET_BASE } = require('../utils/asset-config');

const SUBJECTS = new Set(['biology', 'chemistry', 'english', 'math', 'physics']);
const EVIDENCE_FIELDS = new Set([
  'schemaVersion',
  'verifiedAt',
  'cloudEnvId',
  'sourceCommit',
  'planSnapshotHash',
  'results',
]);
const RESULT_FIELDS = new Set(['fileID', 'status', 'errCode', 'errMsg', 'hasTempFileURL']);
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const URL_SCHEME_PATTERN = /(?:https?|cloud):\/\//i;
const SENSITIVE_PARAMETER_PATTERN = /\b(?:access_token|token|signature|x-amz-signature|credential|expires|q-sign-[a-z0-9._-]*|sign|sig)\s*=/i;
const SOURCE_COMMIT_PATTERN = /^[a-f0-9]{7,64}$/i;
const MAX_ERROR_CODE_LENGTH = 128;
const MAX_ERROR_MESSAGE_LENGTH = 512;

function getSubjectFromAsset(source) {
  const normalized = String(source || '').replace(/^\/+/, '');
  const match = normalized.match(/^assets\/figures\/generated\/(?:subjects\/)?([^/]+)\//);
  return match && SUBJECTS.has(match[1]) ? match[1] : null;
}

function buildVerificationBatches(assets, batchSize = 50) {
  if (!Array.isArray(assets)) throw new Error('资源列表必须为数组');
  if (!Number.isInteger(batchSize) || batchSize <= 0 || batchSize > 50) {
    throw new Error('批次大小必须为 1 到 50 的整数');
  }

  const batches = [];
  for (let index = 0; index < assets.length; index += batchSize) {
    batches.push(assets.slice(index, index + batchSize));
  }
  return batches;
}

function snapshotInput(plan) {
  return {
    schemaVersion: plan.schemaVersion,
    cloudEnvId: plan.cloudEnvId,
    sourceCommit: plan.sourceCommit,
    subject: plan.subject,
    assetCount: plan.assetCount,
    assets: [...plan.assets]
      .map((asset) => ({
        source: asset.source,
        cloudPath: asset.cloudPath,
        width: asset.width,
        height: asset.height,
        bytes: asset.bytes,
        sha256: asset.sha256,
        fileID: asset.fileID,
      }))
      .sort((left, right) => left.fileID.localeCompare(right.fileID)),
  };
}

function getPlanSnapshotHash(plan) {
  return crypto.createHash('sha256').update(JSON.stringify(snapshotInput(plan))).digest('hex');
}

function buildCloudAssetPlan({ manifest, sourceCommit = null, subject = null }) {
  if (!manifest || !Array.isArray(manifest.assets)) throw new Error('资源 manifest 必须包含 assets 数组');
  if (sourceCommit !== null && !isValidSourceCommit(sourceCommit)) {
    throw new Error('sourceCommit 必须为 null 或 7 到 64 位十六进制 Git 提交标识');
  }

  const assets = manifest.assets
    .filter((asset) => !subject || getSubjectFromAsset(asset.source) === subject)
    .map((asset) => ({
      ...asset,
      fileID: `${REMOTE_ASSET_BASE}${String(asset.cloudPath || '').startsWith('/') ? asset.cloudPath : `/${asset.cloudPath || ''}`}`,
    }));
  const plan = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    cloudEnvId: CLOUD_ENV_ID,
    sourceCommit,
    subject,
    assetCount: assets.length,
    assets,
    batches: buildVerificationBatches(assets),
  };

  return {
    ...plan,
    snapshotHash: getPlanSnapshotHash(plan),
  };
}

function containsTempFileURL(value) {
  if (!value || typeof value !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(value, 'tempFileURL')) return true;
  return Object.values(value).some((item) => containsTempFileURL(item));
}

function assertAllowedKeys(value, allowedKeys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}必须为对象`);
  }
  Object.keys(value).forEach((key) => {
    if (!allowedKeys.has(key)) throw new Error(`${label}含未批准字段：${key}`);
  });
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !ISO_TIMESTAMP_PATTERN.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function isValidSourceCommit(value) {
  return typeof value === 'string' && SOURCE_COMMIT_PATTERN.test(value);
}

function isValidErrorCode(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string'
    && value.length > 0
    && value.length <= MAX_ERROR_CODE_LENGTH
    && /^[A-Za-z0-9._-]+$/.test(value);
}

function decodePercentEscapes(value) {
  if (/%[0-9A-Fa-f](?![0-9A-Fa-f])/.test(value)) return null;

  let invalid = false;
  const decoded = value.replace(/(?:%[0-9A-Fa-f]{2})+/g, (encoded) => {
    try {
      return decodeURIComponent(encoded);
    } catch (error) {
      invalid = true;
      return encoded;
    }
  });
  return invalid ? null : decoded;
}

function decodeRepeatedly(value) {
  let decoded = value;
  const maxPasses = Math.max(1, Math.min(MAX_ERROR_MESSAGE_LENGTH, value.length));
  for (let pass = 0; pass < maxPasses; pass += 1) {
    const next = decodePercentEscapes(decoded);
    if (next === null) return null;
    if (next === decoded) return decoded;
    decoded = next;
  }
  return null;
}

function isSafeErrorMessage(value) {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string' || value.length > MAX_ERROR_MESSAGE_LENGTH || /[\u0000-\u001F\u007F]/.test(value)) {
    return false;
  }
  const decoded = decodeRepeatedly(value);
  return decoded !== null
    && !/[\u0000-\u001F\u007F]/.test(decoded)
    && !URL_SCHEME_PATTERN.test(decoded)
    && !SENSITIVE_PARAMETER_PATTERN.test(decoded);
}

function validateCloudAssetEvidence({ plan, evidence, expectedCommit }) {
  if (containsTempFileURL(evidence)) throw new Error('证据不得包含临时 URL');
  if (!plan || plan.schemaVersion !== 1) throw new Error('计划 schemaVersion 必须为 1');
  if (!isValidSourceCommit(plan.sourceCommit)) throw new Error('计划 sourceCommit 无效');
  assertAllowedKeys(evidence, EVIDENCE_FIELDS, '证据');
  if (!evidence || evidence.schemaVersion !== 1) throw new Error('证据 schemaVersion 必须为 1');
  if (!isValidDateString(evidence.verifiedAt)) throw new Error('证据 verifiedAt 必须为有效日期字符串');
  if (!isValidSourceCommit(evidence.sourceCommit)) throw new Error('证据 sourceCommit 无效');
  if (!isValidSourceCommit(expectedCommit)) throw new Error('expectedCommit sourceCommit 无效');
  if (plan.cloudEnvId !== CLOUD_ENV_ID || evidence.cloudEnvId !== plan.cloudEnvId) {
    throw new Error('证据环境与计划不一致');
  }
  if (plan.sourceCommit !== expectedCommit || evidence.sourceCommit !== plan.sourceCommit) {
    throw new Error('证据提交与计划不一致');
  }
  if (plan.snapshotHash !== getPlanSnapshotHash(plan) || evidence.planSnapshotHash !== plan.snapshotHash) {
    throw new Error('证据快照哈希与计划不一致');
  }
  if (!Array.isArray(plan.assets) || plan.assetCount !== plan.assets.length) {
    throw new Error('计划资源集合无效');
  }
  if (!Array.isArray(evidence.results)) throw new Error('证据结果必须为数组');

  const expectedFileIDs = new Set(plan.assets.map((asset) => asset.fileID));
  if (expectedFileIDs.size !== plan.assets.length) throw new Error('计划 fileID 重复');

  const resultFileIDs = new Set();
  evidence.results.forEach((result) => {
    assertAllowedKeys(result, RESULT_FIELDS, '证据结果');
    if (!isValidErrorCode(result.errCode)) {
      throw new Error(`证据结果 errCode 无效：${result.fileID || '(empty)'}`);
    }
    if (result.errMsg !== undefined && result.errMsg !== null && typeof result.errMsg !== 'string') {
      throw new Error(`证据结果错误字段必须为标量：${result.fileID || '(empty)'}`);
    }
    if (!isSafeErrorMessage(result.errMsg)) {
      throw new Error(`证据结果 errMsg 必须为安全文本：${result.fileID || '(empty)'}`);
    }
    if (resultFileIDs.has(result.fileID)) throw new Error(`证据结果 fileID 重复：${result.fileID}`);
    resultFileIDs.add(result.fileID);
    if (!expectedFileIDs.has(result.fileID)) throw new Error(`证据结果含未知 fileID：${result.fileID}`);
    if (result.status !== 0) throw new Error(`证据结果 status 不为 0：${result.fileID}`);
    if (result.hasTempFileURL !== true) throw new Error(`证据结果缺少临时 URL 标记：${result.fileID}`);
  });

  if (resultFileIDs.size !== expectedFileIDs.size) throw new Error('证据结果遗漏计划 fileID');
  return true;
}

module.exports = {
  buildCloudAssetPlan,
  buildVerificationBatches,
  getPlanSnapshotHash,
  getSubjectFromAsset,
  validateCloudAssetEvidence,
};
