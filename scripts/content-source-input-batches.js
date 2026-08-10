const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  buildContentSourceCatalog,
  buildContentSourceCatalogFromInput,
  filterContentSourceCatalog,
} = require('./content-source-catalog');
const { getContentSourceBatch, SOURCE_BATCHES } = require('./check-content-source-batches');
const { collectInputSourceKeys, loadSourceInputFile } = require('./content-source-input');
const { buildContentSourceInputAuditReport } = require('./content-source-input-audit');

const MANIFEST_SCHEMA_VERSION = 1;
const SOURCE_KINDS = new Set(['unknown', 'current-fixture', 'external-source']);
const PLACEHOLDER_SOURCE_HOSTS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'localhost',
]);

function isPlaceholderSourceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return PLACEHOLDER_SOURCE_HOSTS.has(hostname)
      || hostname.endsWith('.invalid')
      || hostname.endsWith('.test')
      || hostname.endsWith('.example');
  } catch (error) {
    return false;
  }
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`内容源输入批次 manifest：${field} 必须为非空字符串`);
  }
  return value.trim();
}

function normalizeSourceKind(value) {
  const sourceKind = value === undefined ? 'unknown' : requireText(value, 'sourceKind');
  if (!SOURCE_KINDS.has(sourceKind)) {
    throw new Error(`内容源输入批次 manifest：sourceKind 无效：${sourceKind}`);
  }
  return sourceKind;
}

function normalizeEvidenceSourceKeys(value, index) {
  const sourceKeys = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[|,]/)
      : [];
  return [...new Set(sourceKeys.map((sourceKey) => requireText(sourceKey, 'sourceEvidence.sourceKeys', index)))].sort();
}

function normalizeSourceEvidence(value, index) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`内容源输入批次 manifest 第 ${index + 1} 项 sourceEvidence 无效`);
  }
  const sourceKeys = normalizeEvidenceSourceKeys(value.sourceKeys, index);
  if (!sourceKeys.length) {
    throw new Error(`内容源输入批次 manifest 第 ${index + 1} 项 sourceEvidence.sourceKeys 不能为空`);
  }
  const sourceUrls = value.sourceUrls === undefined ? [] : value.sourceUrls;
  if (!Array.isArray(sourceUrls)) {
    throw new Error(`内容源输入批次 manifest 第 ${index + 1} 项 sourceEvidence.sourceUrls 必须为数组`);
  }
  const normalizedUrls = [...new Set(sourceUrls.map((sourceUrl) => requireText(sourceUrl, 'sourceEvidence.sourceUrls', index)))].sort();
  normalizedUrls.forEach((sourceUrl) => {
    let parsed;
    try {
      parsed = new URL(sourceUrl);
    } catch (error) {
      throw new Error(`内容源输入批次 manifest 第 ${index + 1} 项 sourceEvidence.sourceUrls 无效：${sourceUrl}`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`内容源输入批次 manifest 第 ${index + 1} 项 sourceEvidence.sourceUrls 必须使用 http/https：${sourceUrl}`);
    }
  });
  const reviewedAt = requireText(value.reviewedAt, 'sourceEvidence.reviewedAt', index);
  if (Number.isNaN(Date.parse(reviewedAt))) {
    throw new Error(`内容源输入批次 manifest 第 ${index + 1} 项 sourceEvidence.reviewedAt 无效：${reviewedAt}`);
  }
  return {
    sourceKeys,
    sourceUrls: normalizedUrls,
    reviewedAt,
    note: requireText(value.note, 'sourceEvidence.note', index),
  };
}

function normalizeInputHash(value, index) {
  const inputHash = requireText(value, `batches[${index}].inputHash`);
  if (!/^[a-f0-9]{64}$/.test(inputHash)) {
    throw new Error(`内容源输入批次 manifest 第 ${index + 1} 项 inputHash 必须为 64 位十六进制哈希`);
  }
  return inputHash;
}

function normalizeBatchManifest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('内容源输入批次 manifest 根对象无效');
  }
  if (input.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    throw new Error(`内容源输入批次 manifest schemaVersion 必须为 ${MANIFEST_SCHEMA_VERSION}`);
  }
  const sourceVersion = requireText(input.sourceVersion, 'sourceVersion');
  const sourceKind = normalizeSourceKind(input.sourceKind);
  if (!Array.isArray(input.batches) || !input.batches.length) {
    throw new Error('内容源输入批次 manifest batches 不能为空');
  }

  const ids = new Set();
  const batches = input.batches.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`内容源输入批次 manifest 第 ${index + 1} 项无效`);
    }
    const id = requireText(entry.id, `batches[${index}].id`);
    if (ids.has(id)) throw new Error(`内容源输入批次 manifest 批次重复：${id}`);
    ids.add(id);
    if (!getContentSourceBatch(id)) throw new Error(`未知内容源批次：${id}`);
    const inputPath = requireText(entry.path, `batches[${index}].path`);
    if (path.isAbsolute(inputPath)) {
      throw new Error(`内容源输入批次 manifest 路径必须为相对路径：${inputPath}`);
    }
    const sourceKind = normalizeSourceKind(entry.sourceKind === undefined ? input.sourceKind : entry.sourceKind);
    const inputHash = entry.inputHash === undefined ? undefined : normalizeInputHash(entry.inputHash, index);
    const sourceEvidence = entry.sourceEvidence === undefined
      ? null
      : normalizeSourceEvidence(entry.sourceEvidence, index);
    return {
      id,
      path: inputPath,
      sourceKind,
      ...(inputHash ? { inputHash } : {}),
      ...(sourceEvidence ? { sourceEvidence } : {}),
    };
  });

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    sourceVersion,
    sourceKind,
    batches,
  };
}

function countMetrics(entities) {
  return entities.reduce((totals, entity) => ({
    examples: totals.examples + entity.exampleCount,
    experiments: totals.experiments + entity.experimentCount,
    assets: totals.assets + entity.assetCount,
  }), { examples: 0, experiments: 0, assets: 0 });
}

function buildPendingResult(entry, reason) {
  const batch = getContentSourceBatch(entry.id);
  return {
    id: batch.id,
    subjectId: batch.subjectId,
    type: batch.type,
    path: entry.path || null,
    sourceKind: entry.sourceKind || 'unknown',
    sourceEvidence: entry.sourceEvidence || null,
    status: 'pending',
    reason,
  };
}

function auditBatchInput(entry, baseDirectory, currentCatalog, sourceVersion) {
  const batch = getContentSourceBatch(entry.id);
  const relativePath = entry.path;
  const absolutePath = path.resolve(baseDirectory, relativePath);
  if (!fs.existsSync(absolutePath)) return buildPendingResult(entry, 'file-not-found');

  try {
    const input = loadSourceInputFile(absolutePath, {
      sourceVersion,
    });
    if (entry.inputHash && input.inputHash !== entry.inputHash) {
      return {
        id: batch.id,
        subjectId: batch.subjectId,
        type: batch.type,
        path: relativePath,
        sourceKind: entry.sourceKind,
        sourceEvidence: entry.sourceEvidence || null,
        status: 'failed',
        reason: 'manifest-input-hash-mismatch',
        expectedInputHash: entry.inputHash,
        actualInputHash: input.inputHash,
        error: `${batch.id} 输入文件哈希与 manifest 不一致`,
      };
    }
    const current = filterContentSourceCatalog(currentCatalog, {
      subjectId: batch.subjectId,
      type: batch.type,
    });
    const imported = buildContentSourceCatalogFromInput(input);
    const metrics = countMetrics(input.entities);

    assert.strictEqual(input.entityCount, batch.expectedCount, `${batch.id} 导入实体数量不符`);
    assert.strictEqual(input.aliasCount, batch.expectedAliasCount, `${batch.id} 导入别名数量不符`);
    assert.ok(
      input.entities.every((entity) => entity.subjectId === batch.subjectId && entity.type === batch.type),
      `${batch.id} 导入范围不符`,
    );
    assert.deepStrictEqual(metrics, {
      examples: batch.expectedExampleCount,
      experiments: batch.expectedExperimentCount,
      assets: batch.expectedAssetCount,
    }, `${batch.id} 导入统计不符`);

    const report = buildContentSourceInputAuditReport({
      input,
      importedCatalog: imported,
      currentCatalog: current,
      batch,
    });
    return {
      id: batch.id,
      subjectId: batch.subjectId,
      type: batch.type,
      path: relativePath,
      sourceKind: entry.sourceKind,
      sourceEvidence: entry.sourceEvidence || null,
      status: report.status,
      inputSourceVersion: input.sourceVersion,
      inputHash: report.inputHash,
      currentSourceHash: report.currentSourceHash,
      importedSourceHash: report.importedSourceHash,
      inputSourceKeys: collectInputSourceKeys(input),
      counts: report.counts,
      metrics: report.metrics,
      review: report.review,
      diff: report.diff.counts,
    };
  } catch (error) {
    return {
      id: batch.id,
      subjectId: batch.subjectId,
      type: batch.type,
      path: relativePath,
      status: 'failed',
      reason: 'invalid-input',
      error: error.message,
    };
  }
}

function buildContentSourceInputBatchAudit({
  manifest,
  baseDirectory = process.cwd(),
  currentCatalog = buildContentSourceCatalog(),
  requireAllBatches = false,
  requireExternalSource = false,
  requireReviewed = false,
} = {}) {
  const normalized = normalizeBatchManifest(manifest);
  const entries = [...normalized.batches];
  if (requireAllBatches) {
    const registeredIds = new Set(entries.map((entry) => entry.id));
    SOURCE_BATCHES.forEach((batch) => {
      if (!registeredIds.has(batch.id)) entries.push({ id: batch.id, path: null, sourceKind: 'unknown' });
    });
  }
  const externalSourceIssues = requireExternalSource
    ? entries
      .map((entry) => {
        if (entry.sourceKind !== 'external-source') {
          return {
            id: entry.id,
            path: entry.path || null,
            sourceKind: entry.sourceKind || 'unknown',
            reason: 'source-kind-not-external',
          };
        }
        if (!entry.sourceEvidence) {
          return {
            id: entry.id,
            path: entry.path || null,
            sourceKind: entry.sourceKind,
            reason: 'source-evidence-missing',
          };
        }
        if (!entry.sourceEvidence.sourceUrls || !entry.sourceEvidence.sourceUrls.length) {
          return {
            id: entry.id,
            path: entry.path || null,
            sourceKind: entry.sourceKind,
            reason: 'source-evidence-url-missing',
          };
        }
        if (entry.sourceEvidence.sourceUrls.some(isPlaceholderSourceUrl)) {
          return {
            id: entry.id,
            path: entry.path || null,
            sourceKind: entry.sourceKind,
            reason: 'source-evidence-placeholder-url',
          };
        }
        return null;
      })
      .filter(Boolean)
    : [];

  const batches = entries.map((entry) => (
    entry.path
      ? auditBatchInput(entry, baseDirectory, currentCatalog, normalized.sourceVersion)
      : buildPendingResult(entry, 'manifest-missing')
  ));
  if (requireExternalSource && currentCatalog.sourceVersion) {
    const issueIds = new Set(externalSourceIssues.map((issue) => issue.id));
    batches.forEach((batch) => {
      if (issueIds.has(batch.id)) return;
      if (batch.inputSourceVersion === currentCatalog.sourceVersion) {
        externalSourceIssues.push({
          id: batch.id,
          path: batch.path || null,
          sourceKind: batch.sourceKind || 'unknown',
          reason: 'input-source-version-current',
        });
        issueIds.add(batch.id);
        return;
      }
      if (!batch.sourceEvidence || !Array.isArray(batch.inputSourceKeys)) return;
      const unreferencedSourceKeys = batch.sourceEvidence.sourceKeys
        .filter((sourceKey) => !batch.inputSourceKeys.includes(sourceKey));
      if (!unreferencedSourceKeys.length) return;
      externalSourceIssues.push({
        id: batch.id,
        path: batch.path || null,
        sourceKind: batch.sourceKind || 'unknown',
        reason: 'source-evidence-key-unreferenced',
        sourceKeys: unreferencedSourceKeys,
      });
      issueIds.add(batch.id);
    });
  }
  const reviewIssues = requireReviewed
    ? batches
      .filter((batch) => batch.review && batch.review.untracked > 0)
      .map((batch) => ({
        id: batch.id,
        path: batch.path || null,
        untracked: batch.review.untracked,
        reason: 'untracked-review-status',
      }))
    : [];
  const summary = batches.reduce((counts, batch) => ({
    ...counts,
    [batch.status]: counts[batch.status] + 1,
  }), { total: batches.length, passed: 0, changed: 0, pending: 0, failed: 0 });
  const status = summary.failed > 0
    ? 'failed'
    : externalSourceIssues.length > 0
      ? 'blocked'
      : reviewIssues.length > 0
        ? 'blocked'
      : summary.pending > 0
      ? 'pending'
      : summary.changed > 0
        ? 'changed'
        : 'passed';

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    status,
    sourceVersion: normalized.sourceVersion,
    sourceKind: normalized.sourceKind,
    requireAllBatches,
    requirements: {
      requireExternalSource,
      requireReviewed,
      externalSourceIssues,
      reviewIssues,
    },
    summary,
    batches,
  };
}

module.exports = {
  MANIFEST_SCHEMA_VERSION,
  SOURCE_KINDS,
  isPlaceholderSourceUrl,
  normalizeBatchManifest,
  buildContentSourceInputBatchAudit,
};
