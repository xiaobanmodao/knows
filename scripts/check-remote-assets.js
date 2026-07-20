const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { collectRemoteAssets } = require('./asset-inventory');

const outRoot = process.argv[2] || 'dist/remote-assets';
const manifestPath = path.join(outRoot, 'manifest.json');
const issues = [];
const sizeLimit = 200 * 1024;

if (!fs.existsSync(manifestPath)) {
  console.error(`远程资源清单不存在：${manifestPath}，请先运行 node scripts/prepare-remote-assets.js`);
  process.exit(1);
}

const expected = collectRemoteAssets();
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const records = new Map((manifest.assets || []).map((item) => [item.source, item]));
const hashes = new Map();

expected.forEach((source) => {
  const record = records.get(source);
  const output = path.join(outRoot, source);

  if (!record) {
    issues.push(`${source}: 未进入远程资源清单`);
    return;
  }

  if (!fs.existsSync(output)) {
    issues.push(`${source}: 压缩文件不存在`);
    return;
  }

  const buffer = fs.readFileSync(output);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  if (buffer.length > sizeLimit) issues.push(`${source}: ${buffer.length} bytes 超过 200KB`);
  if (!width || !height || width > 960 || height > 675) issues.push(`${source}: 压缩尺寸异常 ${width}x${height}`);
  if (record.bytes !== buffer.length) issues.push(`${source}: 清单体积与文件不一致`);
  if (record.width !== width || record.height !== height) issues.push(`${source}: 清单尺寸与文件不一致`);
  if (record.sha256 !== hash) issues.push(`${source}: 清单哈希与文件不一致`);
  if (record.cloudPath !== `/${source}`) issues.push(`${source}: 云路径不一致`);

  if (hashes.has(hash)) {
    issues.push(`${source}: 压缩内容与 ${hashes.get(hash)} 重复`);
  } else {
    hashes.set(hash, source);
  }
});

(manifest.assets || []).forEach((record) => {
  if (!expected.includes(record.source)) issues.push(`${record.source}: 清单含有运行时未引用资源`);
});

if (manifest.assetCount !== expected.length || records.size !== expected.length) {
  issues.push(`资源数量不一致：运行时 ${expected.length}，清单 ${manifest.assetCount}，记录 ${records.size}`);
}

if (issues.length) {
  console.log('FOUND_REMOTE_ASSET_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK ${expected.length} remote assets, dimensions, size limits, paths and hashes checked`);
