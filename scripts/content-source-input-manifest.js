const fs = require('fs');
const path = require('path');

const {
  buildContentSourceCatalog,
  filterContentSourceCatalog,
} = require('./content-source-catalog');
const { SOURCE_BATCHES } = require('./check-content-source-batches');
const { normalizeSourceInput } = require('./content-source-input');
const { normalizeBatchManifest } = require('./content-source-input-batches');

const DEFAULT_SOURCE_VERSION = 'v1.11-current';

function buildCurrentSourceInputManifest({
  outputDirectory,
  manifestPath,
  sourceVersion = DEFAULT_SOURCE_VERSION,
  currentCatalog = buildContentSourceCatalog(),
} = {}) {
  if (!outputDirectory) throw new Error('当前内容源输入导出目录不能为空');
  if (!manifestPath) throw new Error('当前内容源输入 manifest 路径不能为空');
  if (typeof sourceVersion !== 'string' || !sourceVersion.trim()) {
    throw new Error('当前内容源输入 sourceVersion 必须为非空字符串');
  }

  const absoluteOutputDirectory = path.resolve(outputDirectory);
  const absoluteManifestPath = path.resolve(manifestPath);
  fs.mkdirSync(absoluteOutputDirectory, { recursive: true });

  const batches = SOURCE_BATCHES.map((batch) => {
    const scoped = filterContentSourceCatalog(currentCatalog, {
      subjectId: batch.subjectId,
      type: batch.type,
    });
    const input = normalizeSourceInput({
      ...scoped,
      sourceVersion,
    });
    const filePath = path.join(absoluteOutputDirectory, `${batch.id}.json`);
    fs.writeFileSync(filePath, `${JSON.stringify(input, null, 2)}\n`, 'utf8');
    const relativePath = path.relative(path.dirname(absoluteManifestPath), filePath).split(path.sep).join('/');
    return {
      id: batch.id,
      path: relativePath,
      entityCount: input.entityCount,
      aliasCount: input.aliasCount,
      inputHash: input.inputHash,
      filePath,
    };
  });

  const manifest = normalizeBatchManifest({
    schemaVersion: 1,
    sourceVersion,
    sourceKind: 'current-fixture',
    batches: batches.map(({ id, path: relativePath, inputHash }) => ({
      id,
      path: relativePath,
      sourceKind: 'current-fixture',
      inputHash,
    })),
  });
  fs.mkdirSync(path.dirname(absoluteManifestPath), { recursive: true });
  fs.writeFileSync(absoluteManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    manifest,
    manifestPath: absoluteManifestPath,
    outputDirectory: absoluteOutputDirectory,
    files: batches,
  };
}

module.exports = {
  DEFAULT_SOURCE_VERSION,
  buildCurrentSourceInputManifest,
};
