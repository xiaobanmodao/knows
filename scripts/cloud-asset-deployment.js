const crypto = require('crypto');
const { isDeepStrictEqual } = require('util');

const { CLOUD_ENV_ID, REMOTE_ASSET_BASE } = require('../utils/asset-config');
const {
  getSubjectFromAsset,
  validateCurrentRemoteAssetManifest,
  validateRemoteAssetManifest,
} = require('./remote-asset-manifest');

const SUBJECTS = new Set(['biology', 'chemistry', 'english', 'math', 'physics']);
const PLAN_FIELDS = new Set([
  'schemaVersion',
  'generatedAt',
  'cloudEnvId',
  'sourceCommit',
  'subject',
  'assetCount',
  'assets',
  'batches',
  'snapshotHash',
]);
const PLAN_ASSET_FIELDS = new Set([
  'source',
  'cloudPath',
  'width',
  'height',
  'bytes',
  'sha256',
  'sourceSha256',
  'subject',
  'fileID',
]);
const EVIDENCE_FIELDS = new Set([
  'schemaVersion',
  'verifiedAt',
  'cloudEnvId',
  'sourceCommit',
  'planSnapshotHash',
  'results',
]);
const RESULT_FIELDS = new Set(['fileID', 'status', 'hasTempFileURL']);
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SOURCE_COMMIT_PATTERN = /^[a-f0-9]{7,64}$/i;

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
        sourceSha256: asset.sourceSha256,
        subject: asset.subject,
        fileID: asset.fileID,
      }))
      .sort((left, right) => left.fileID.localeCompare(right.fileID)),
    batches: batchFileIDs(plan.batches),
  };
}

function getPlanSnapshotHash(plan) {
  return crypto.createHash('sha256').update(JSON.stringify(snapshotInput(plan))).digest('hex');
}

function batchFileIDs(batches) {
  if (!Array.isArray(batches)) return null;
  return batches.map((batch) => {
    if (!Array.isArray(batch)) return null;
    return batch.map((asset) => (asset && typeof asset.fileID === 'string' ? asset.fileID : null));
  });
}

function hasDeterministicVerificationBatches(plan) {
  if (!Array.isArray(plan.assets) || !Array.isArray(plan.batches)) return false;
  const expected = buildVerificationBatches(plan.assets);
  return plan.batches.length === expected.length && plan.batches.every((batch, index) => (
    Array.isArray(batch)
    && batch.length === expected[index].length
    && batch.every((asset, itemIndex) => (
      asset
      && typeof asset === 'object'
      && !Array.isArray(asset)
      && isDeepStrictEqual(asset, expected[index][itemIndex])
    ))
  ));
}

function buildCloudAssetPlan({ manifest, sourceCommit = null, subject = null }) {
  validateRemoteAssetManifest(manifest);
  if (sourceCommit !== null && !isValidSourceCommit(sourceCommit)) {
    throw new Error('sourceCommit 必须为 null 或 7 到 64 位十六进制 Git 提交标识');
  }
  assertValidSubject(subject);

  const assets = manifest.assets
    .filter((asset) => !subject || getSubjectFromAsset(asset.source) === subject)
    .map((asset) => {
      const assetSubject = getSubjectFromAsset(asset.source);
      return {
        source: asset.source,
        cloudPath: asset.cloudPath,
        width: asset.width,
        height: asset.height,
        bytes: asset.bytes,
        sha256: asset.sha256,
        sourceSha256: asset.sourceSha256,
        subject: assetSubject,
        fileID: `${REMOTE_ASSET_BASE}${asset.cloudPath}`,
      };
    });
  if (assets.length === 0) {
    throw new Error(subject
      ? '主题计划资源数量必须大于 0'
      : '计划资源数量必须大于 0');
  }
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
  const canonicalPlan = {
    ...plan,
    snapshotHash: getPlanSnapshotHash(plan),
  };
  validateCloudAssetPlan(canonicalPlan);
  return canonicalPlan;
}

function validateCloudAssetPlan(plan) {
  assertExactKeys(plan, PLAN_FIELDS, '计划');
  if (plan.schemaVersion !== 1) throw new Error('计划 schemaVersion 必须为 1');
  if (!isValidDateString(plan.generatedAt)) throw new Error('计划 generatedAt 必须为有效日期字符串');
  if (plan.cloudEnvId !== CLOUD_ENV_ID) throw new Error('计划 cloudEnvId 无效');
  if (plan.sourceCommit !== null && !isValidSourceCommit(plan.sourceCommit)) {
    throw new Error('计划 sourceCommit 无效');
  }
  assertValidSubject(plan.subject);
  if (!Array.isArray(plan.assets) || plan.assetCount !== plan.assets.length) {
    throw new Error('计划资源集合无效');
  }
  assertPlanHasAssets(plan);

  const identities = {
    source: new Set(),
    cloudPath: new Set(),
    fileID: new Set(),
  };
  plan.assets.forEach((asset, index) => {
    const label = `计划 assets[${index}]`;
    assertExactKeys(asset, PLAN_ASSET_FIELDS, label);
    const assetSubject = getSubjectFromAsset(asset.source);
    if (asset.subject !== assetSubject) throw new Error(`${label} subject 与资源不匹配`);
    if (plan.subject !== null && asset.subject !== plan.subject) {
      throw new Error('计划 subject 与资源不匹配');
    }
    if (asset.fileID !== `${REMOTE_ASSET_BASE}${asset.cloudPath}`) throw new Error(`${label} fileID 无效`);
    Object.keys(identities).forEach((field) => {
      if (identities[field].has(asset[field])) throw new Error(`${label} ${field} 重复`);
      identities[field].add(asset[field]);
    });
  });

  validateRemoteAssetManifest({
    version: 2,
    generatedAt: plan.generatedAt,
    assetCount: plan.assetCount,
    assets: plan.assets.map((asset) => ({
      source: asset.source,
      cloudPath: asset.cloudPath,
      width: asset.width,
      height: asset.height,
      bytes: asset.bytes,
      sha256: asset.sha256,
      sourceSha256: asset.sourceSha256,
    })),
  });
  if (!hasDeterministicVerificationBatches(plan)) throw new Error('计划验证批次无效');
  if (typeof plan.snapshotHash !== 'string' || !/^[a-f0-9]{64}$/.test(plan.snapshotHash)) {
    throw new Error('计划快照哈希无效');
  }
  if (plan.snapshotHash !== getPlanSnapshotHash(plan)) throw new Error('计划快照哈希无效');
  return true;
}

function buildConsoleVerificationScript(plan) {
  validateCloudAssetPlan(plan);
  if (!isValidSourceCommit(plan.sourceCommit)) throw new Error('计划 sourceCommit 无效');

  const verificationInput = {
    schemaVersion: plan.schemaVersion,
    cloudEnvId: plan.cloudEnvId,
    sourceCommit: plan.sourceCommit,
    planSnapshotHash: plan.snapshotHash,
    batches: batchFileIDs(plan.batches),
  };

  return `/* Paste this script into the WeChat DevTools console after cloud setup. */
(async () => {
  const plan = ${JSON.stringify(verificationInput, null, 2)};
  const resultFor = (fileID, item) => {
    return {
      fileID,
      status: item && Number.isFinite(item.status) ? item.status : -1,
      hasTempFileURL: Boolean(item && typeof item.tempFileURL === 'string' && item.tempFileURL.length > 0),
    };
  };
  const results = [];
  for (const fileIDs of plan.batches) {
    try {
      const response = await wx.cloud.callFunction({ name: 'getImageTempUrls', data: { fileIDs } });
      const fileList = response && response.result && Array.isArray(response.result.fileList)
        ? response.result.fileList
        : [];
      const resultByFileID = new Map(fileList.map((item) => [item && item.fileID, item]));
      fileIDs.forEach((fileID) => results.push(resultFor(fileID, resultByFileID.get(fileID))));
    } catch (error) {
      fileIDs.forEach((fileID) => results.push({
        fileID,
        status: -1,
        hasTempFileURL: false,
      }));
    }
  }
  console.log(JSON.stringify({
    schemaVersion: 1,
    verifiedAt: new Date().toISOString(),
    cloudEnvId: plan.cloudEnvId,
    sourceCommit: plan.sourceCommit,
    planSnapshotHash: plan.planSnapshotHash,
    results,
  }, null, 2));
})().catch(() => {});
`;
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
    if (!allowedKeys.has(key)) throw new Error(`${label}含未批准字段`);
  });
}

function assertExactKeys(value, allowedKeys, label) {
  assertAllowedKeys(value, allowedKeys, label);
  allowedKeys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(value, key)) throw new Error(`${label}缺少必要字段`);
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

function assertPlanHasAssets(plan) {
  if (!Number.isInteger(plan.assetCount) || plan.assetCount <= 0) {
    throw new Error('计划资源数量必须大于 0');
  }
}

function assertValidSubject(subject) {
  if (subject !== null && !SUBJECTS.has(subject)) {
    throw new Error('计划 subject 无效');
  }
}

function validateCloudAssetEvidence({ plan, evidence, expectedCommit }) {
  validateCloudAssetPlan(plan);
  if (containsTempFileURL(evidence)) throw new Error('证据不得包含临时 URL');
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
  if (evidence.planSnapshotHash !== plan.snapshotHash) {
    throw new Error('证据快照哈希与计划不一致');
  }
  if (!Array.isArray(evidence.results)) throw new Error('证据结果必须为数组');

  const expectedFileIDs = new Set(plan.assets.map((asset) => asset.fileID));
  if (expectedFileIDs.size !== plan.assets.length) throw new Error('计划 fileID 重复');

  const resultFileIDs = new Set();
  evidence.results.forEach((result, index) => {
    const label = `证据结果[${index}]`;
    assertAllowedKeys(result, RESULT_FIELDS, label);
    if (resultFileIDs.has(result.fileID)) throw new Error(`${label} fileID 重复`);
    resultFileIDs.add(result.fileID);
    if (!expectedFileIDs.has(result.fileID)) throw new Error(`${label}含未知 fileID`);
    if (result.status !== 0) throw new Error(`${label} status 不为 0`);
    if (result.hasTempFileURL !== true) throw new Error(`${label}缺少临时 URL 标记`);
  });

  if (resultFileIDs.size !== expectedFileIDs.size) throw new Error('证据结果遗漏计划 fileID');
  return true;
}

function validateStrictCloudAssetEvidence({ manifest, evidence, sourceCommit, manifestOptions }) {
  validateCurrentRemoteAssetManifest(manifest, manifestOptions);
  const plan = buildCloudAssetPlan({ manifest, sourceCommit, subject: null });
  return validateCloudAssetEvidence({ plan, evidence, expectedCommit: sourceCommit });
}

module.exports = {
  buildCloudAssetPlan,
  buildConsoleVerificationScript,
  buildVerificationBatches,
  getPlanSnapshotHash,
  getSubjectFromAsset,
  validateCloudAssetPlan,
  validateCloudAssetEvidence,
  validateStrictCloudAssetEvidence,
};
