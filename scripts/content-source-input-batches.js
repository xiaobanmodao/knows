const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  buildContentSourceCatalog,
  buildContentSourceCatalogFromInput,
  filterContentSourceCatalog,
} = require('./content-source-catalog');
const { getContentSourceBatch, SOURCE_BATCHES } = require('./check-content-source-batches');
const { loadSourceInputFile } = require('./content-source-input');
const { buildContentSourceInputAuditReport } = require('./content-source-input-audit');

const MANIFEST_SCHEMA_VERSION = 1;

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`内容源输入批次 manifest：${field} 必须为非空字符串`);
  }
  return value.trim();
}

function normalizeBatchManifest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('内容源输入批次 manifest 根对象无效');
  }
  if (input.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    throw new Error(`内容源输入批次 manifest schemaVersion 必须为 ${MANIFEST_SCHEMA_VERSION}`);
  }
  const sourceVersion = requireText(input.sourceVersion, 'sourceVersion');
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
    return { id, path: inputPath };
  });

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    sourceVersion,
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
      status: report.status,
      inputSourceVersion: input.sourceVersion,
      inputHash: report.inputHash,
      currentSourceHash: report.currentSourceHash,
      importedSourceHash: report.importedSourceHash,
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
} = {}) {
  const normalized = normalizeBatchManifest(manifest);
  const entries = [...normalized.batches];
  if (requireAllBatches) {
    const registeredIds = new Set(entries.map((entry) => entry.id));
    SOURCE_BATCHES.forEach((batch) => {
      if (!registeredIds.has(batch.id)) entries.push({ id: batch.id, path: null });
    });
  }

  const batches = entries.map((entry) => (
    entry.path
      ? auditBatchInput(entry, baseDirectory, currentCatalog, normalized.sourceVersion)
      : buildPendingResult(entry, 'manifest-missing')
  ));
  const summary = batches.reduce((counts, batch) => ({
    ...counts,
    [batch.status]: counts[batch.status] + 1,
  }), { total: batches.length, passed: 0, changed: 0, pending: 0, failed: 0 });
  const status = summary.failed > 0
    ? 'failed'
    : summary.pending > 0
      ? 'pending'
      : summary.changed > 0
        ? 'changed'
        : 'passed';

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    status,
    sourceVersion: normalized.sourceVersion,
    requireAllBatches,
    summary,
    batches,
  };
}

module.exports = {
  MANIFEST_SCHEMA_VERSION,
  normalizeBatchManifest,
  buildContentSourceInputBatchAudit,
};
