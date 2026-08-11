const crypto = require('crypto');

const { CLOUD_ENV_ID, REMOTE_ASSET_BASE } = require('../utils/asset-config');

const SUBJECTS = new Set(['biology', 'chemistry', 'english', 'math', 'physics']);

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

function validateCloudAssetEvidence({ plan, evidence, expectedCommit }) {
  if (containsTempFileURL(evidence)) throw new Error('证据不得包含临时 URL');
  if (!plan || plan.schemaVersion !== 1) throw new Error('计划 schemaVersion 必须为 1');
  if (!evidence || evidence.schemaVersion !== 1) throw new Error('证据 schemaVersion 必须为 1');
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
    if (!result || typeof result !== 'object') throw new Error('证据结果无效');
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
