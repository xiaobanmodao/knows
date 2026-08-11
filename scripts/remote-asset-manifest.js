const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { collectRemoteAssets } = require('./asset-inventory');

const REPOSITORY_ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_ROOT = path.join(REPOSITORY_ROOT, 'dist/remote-assets');
const SUBJECTS = new Set(['biology', 'chemistry', 'english', 'math', 'physics']);
const MANIFEST_FIELDS = new Set(['version', 'generatedAt', 'assetCount', 'assets']);
const ASSET_FIELDS = new Set([
  'source',
  'cloudPath',
  'width',
  'height',
  'bytes',
  'sha256',
  'sourceSha256',
]);
const CURRENT_OPTIONS = new Set(['sourcePaths', 'sourceRoot', 'outputRoot']);
const GENERATED_ASSET_PREFIX = 'assets/figures/generated/';
const POSIX_SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function getSubjectFromAsset(source) {
  assertCanonicalAssetSource(source);
  if (/^assets\/figures\/generated\/(?:topics|templates)\//.test(source)) return 'math';

  const subjectMatch = source.match(/^assets\/figures\/generated\/subjects\/([^/]+)\//);
  if (subjectMatch && SUBJECTS.has(subjectMatch[1])) return subjectMatch[1];
  if (/^assets\/figures\/generated\/chemistry\//.test(source)) return 'chemistry';
  throw new Error('未知资源路径');
}

function assertCanonicalAssetSource(source) {
  if (
    typeof source !== 'string'
    || !source.startsWith(GENERATED_ASSET_PREFIX)
    || !source.endsWith('.png')
    || source.includes('\\')
    || source.includes('?')
    || source.includes('#')
    || path.posix.normalize(source) !== source
  ) {
    throw new Error('资源路径无效');
  }
  const segments = source.split('/');
  if (segments.some((segment) => (
    segment === ''
    || segment === '.'
    || segment === '..'
    || !POSIX_SEGMENT_PATTERN.test(segment)
  ))) {
    throw new Error('资源路径无效');
  }
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function readPngDimensions(buffer, label) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`${label}压缩产物必须为有效 PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function createRemoteAssetManifest(items) {
  if (!Array.isArray(items)) throw new Error('资源列表必须为数组');
  const assets = items.map((item, index) => {
    const label = `资源项[${index}]`;
    if (!item || typeof item !== 'object') throw new Error(`${label}必须为对象`);
    const source = item.source;
    getSubjectFromAsset(source);
    const sourceBuffer = fs.readFileSync(item.sourcePath || source);
    const outputBuffer = fs.readFileSync(item.out);
    const { width, height } = readPngDimensions(outputBuffer, label);
    return {
      source,
      cloudPath: `/${source}`,
      width,
      height,
      bytes: outputBuffer.length,
      sha256: sha256(outputBuffer),
      sourceSha256: sha256(sourceBuffer),
    };
  });
  const manifest = {
    version: 2,
    generatedAt: new Date().toISOString(),
    assetCount: assets.length,
    assets,
  };
  validateRemoteAssetManifest(manifest);
  return manifest;
}

function assertExactKeys(value, fields, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}必须为对象`);
  }
  const keys = Object.keys(value);
  keys.forEach((key) => {
    if (!fields.has(key)) throw new Error(`${label}含未批准字段`);
  });
  fields.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(value, key)) throw new Error(`${label}缺少必要字段`);
  });
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !ISO_TIMESTAMP_PATTERN.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function validateRemoteAssetManifest(manifest) {
  assertExactKeys(manifest, MANIFEST_FIELDS, '资源 manifest');
  if (manifest.version !== 2) throw new Error('资源 manifest version 必须为 2');
  if (!isValidDateString(manifest.generatedAt)) throw new Error('资源 manifest generatedAt 无效');
  if (!Array.isArray(manifest.assets)) throw new Error('资源 manifest assets 必须为数组');
  if (!Number.isInteger(manifest.assetCount) || manifest.assetCount !== manifest.assets.length) {
    throw new Error('资源 manifest assetCount 与 assets 不一致');
  }

  const sources = new Set();
  const cloudPaths = new Set();
  manifest.assets.forEach((asset, index) => {
    const label = `资源 manifest assets[${index}]`;
    assertExactKeys(asset, ASSET_FIELDS, label);
    getSubjectFromAsset(asset.source);
    if (asset.cloudPath !== `/${asset.source}`) throw new Error(`${label} cloudPath 无效`);
    if (!Number.isInteger(asset.width) || asset.width <= 0) throw new Error(`${label} width 无效`);
    if (!Number.isInteger(asset.height) || asset.height <= 0) throw new Error(`${label} height 无效`);
    if (!Number.isInteger(asset.bytes) || asset.bytes <= 0) throw new Error(`${label} bytes 无效`);
    if (typeof asset.sha256 !== 'string' || !SHA256_PATTERN.test(asset.sha256)) {
      throw new Error(`${label} sha256 无效`);
    }
    if (typeof asset.sourceSha256 !== 'string' || !SHA256_PATTERN.test(asset.sourceSha256)) {
      throw new Error(`${label} sourceSha256 无效`);
    }
    if (sources.has(asset.source)) throw new Error(`${label} source 重复`);
    if (cloudPaths.has(asset.cloudPath)) throw new Error(`${label} cloudPath 重复`);
    sources.add(asset.source);
    cloudPaths.add(asset.cloudPath);
  });
  return true;
}

function validateCurrentRemoteAssetManifest(manifest, options = {}) {
  assertAllowedOptions(options);
  validateRemoteAssetManifest(manifest);

  const sourcePaths = options.sourcePaths === undefined ? collectRemoteAssets() : options.sourcePaths;
  const sourceRoot = options.sourceRoot === undefined ? REPOSITORY_ROOT : path.resolve(options.sourceRoot);
  const outputRoot = options.outputRoot === undefined ? DEFAULT_OUTPUT_ROOT : path.resolve(options.outputRoot);
  if (!Array.isArray(sourcePaths) || sourcePaths.some((source) => typeof source !== 'string')) {
    throw new Error('current manifest sourcePaths 必须为字符串数组');
  }

  const expectedSources = [...sourcePaths].sort();
  if (new Set(expectedSources).size !== expectedSources.length) throw new Error('current manifest sourcePaths 含重复值');
  const actualSources = manifest.assets.map((asset) => asset.source).sort();
  if (JSON.stringify(actualSources) !== JSON.stringify(expectedSources)) {
    throw new Error('current manifest 资源集合与运行时资源集合不一致');
  }

  const records = new Map(manifest.assets.map((asset) => [asset.source, asset]));
  expectedSources.forEach((source, index) => {
    const label = `current manifest assets[${index}]`;
    const record = records.get(source);
    let sourceBuffer;
    let outputBuffer;
    try {
      sourceBuffer = fs.readFileSync(path.join(sourceRoot, source));
      outputBuffer = fs.readFileSync(path.join(outputRoot, source));
    } catch (error) {
      throw new Error(`${label}文件不可读取`);
    }
    const { width, height } = readPngDimensions(outputBuffer, label);
    if (record.sourceSha256 !== sha256(sourceBuffer)) throw new Error(`${label} sourceSha256 与当前原图不一致`);
    if (record.sha256 !== sha256(outputBuffer)) throw new Error(`${label} sha256 与当前压缩产物不一致`);
    if (record.bytes !== outputBuffer.length) throw new Error(`${label} bytes 与当前压缩产物不一致`);
    if (record.width !== width || record.height !== height) {
      throw new Error(`${label} width/height 与当前压缩产物不一致`);
    }
  });
  return true;
}

function assertAllowedOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('current manifest options 必须为对象');
  }
  Object.keys(options).forEach((key) => {
    if (!CURRENT_OPTIONS.has(key)) throw new Error('current manifest options 含未批准字段');
  });
}

module.exports = {
  createRemoteAssetManifest,
  getSubjectFromAsset,
  validateCurrentRemoteAssetManifest,
  validateRemoteAssetManifest,
};
