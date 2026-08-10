const fs = require('fs');
const path = require('path');

const {
  isPlaceholderSourceUrl,
  normalizeBatchManifest,
} = require('./content-source-input-batches');
const { SOURCE_VERSION: CURRENT_SOURCE_VERSION } = require('./content-source-catalog');
const { loadSourceInputFile } = require('./content-source-input');

const DEFAULT_SOURCE_VERSION = 'external-source-v1';

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} 必须为非空字符串`);
  }
  return value.trim();
}

function buildExternalSourceManifest({
  batchId,
  inputPath,
  manifestPath,
  sourceVersion = DEFAULT_SOURCE_VERSION,
  sourceKeys = [],
  sourceUrls = [],
  reviewedAt,
  note,
} = {}) {
  const id = requireText(batchId, 'batchId');
  const sourceFile = path.resolve(requireText(inputPath, 'inputPath'));
  const outputPath = path.resolve(requireText(manifestPath, 'manifestPath'));
  const normalizedSourceVersion = requireText(sourceVersion, 'sourceVersion');
  if (!fs.existsSync(sourceFile) || !fs.statSync(sourceFile).isFile()) {
    throw new Error(`外部内容源输入文件不存在：${sourceFile}`);
  }
  if (sourceFile === outputPath) {
    throw new Error(`manifest 不能覆盖输入文件：${sourceFile}`);
  }
  if (!Array.isArray(sourceUrls) || !sourceUrls.length) {
    throw new Error('外部内容源 manifest 至少需要一个 sourceUrls 来源 URL');
  }
  if (sourceUrls.some(isPlaceholderSourceUrl)) {
    throw new Error('外部内容源 manifest 不得使用占位 sourceUrls 来源 URL');
  }
  const input = loadSourceInputFile(sourceFile, { sourceVersion: normalizedSourceVersion });
  if (input.sourceVersion === CURRENT_SOURCE_VERSION || normalizedSourceVersion === CURRENT_SOURCE_VERSION) {
    throw new Error(`外部内容源 manifest 不得使用当前内容源版本：${CURRENT_SOURCE_VERSION}`);
  }
  const relativeInputPath = path.relative(path.dirname(outputPath), sourceFile).split(path.sep).join('/');
  const manifest = normalizeBatchManifest({
    schemaVersion: 1,
    sourceVersion: normalizedSourceVersion,
    sourceKind: 'external-source',
    batches: [{
      id,
      path: relativeInputPath,
      sourceKind: 'external-source',
      inputHash: input.inputHash,
      sourceEvidence: {
        sourceKeys,
        sourceUrls,
        reviewedAt,
        note,
      },
    }],
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { manifest, manifestPath: outputPath, inputPath: sourceFile, inputHash: input.inputHash };
}

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getOptions(name) {
  const values = [];
  process.argv.forEach((value, index) => {
    if (value === name && process.argv[index + 1]) values.push(process.argv[index + 1]);
  });
  return values;
}

function main() {
  const result = buildExternalSourceManifest({
    batchId: getOption('--batch'),
    inputPath: getOption('--input'),
    manifestPath: getOption('--manifest') || 'dist/content-audit/external-source-manifest.json',
    sourceVersion: getOption('--source-version') || DEFAULT_SOURCE_VERSION,
    sourceKeys: getOptions('--source-key'),
    sourceUrls: getOptions('--source-url'),
    reviewedAt: getOption('--reviewed-at'),
    note: getOption('--note'),
  });
  console.log(`OK external content source manifest: ${result.manifestPath}`);
  console.log(`Batch: ${result.manifest.batches[0].id}`);
  console.log(`Input: ${result.inputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FOUND_EXTERNAL_CONTENT_SOURCE_MANIFEST_ISSUE\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_SOURCE_VERSION,
  buildExternalSourceManifest,
};
