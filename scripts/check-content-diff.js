const fs = require('fs');
const path = require('path');

const { buildContentManifest } = require('./content-manifest');

const root = path.resolve(__dirname, '..');
const baselinePath = path.join(__dirname, 'fixtures/content-manifest-v1.3.json');
const outputPath = path.join(root, 'dist/content-audit/content-diff.json');

if (!fs.existsSync(baselinePath)) {
  throw new Error('缺少 v1.3 内容基线，请先运行 node scripts/build-content-baseline.js');
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const current = buildContentManifest('v1.4-current');
const baselineKeys = new Set(Object.keys(baseline.entities));
const currentKeys = new Set(Object.keys(current.entities));
const added = [...currentKeys].filter((key) => !baselineKeys.has(key)).map((key) => current.entities[key]);
const removed = [...baselineKeys].filter((key) => !currentKeys.has(key)).map((key) => baseline.entities[key]);
const modified = [...currentKeys]
  .filter((key) => baselineKeys.has(key) && baseline.entities[key].hash !== current.entities[key].hash)
  .map((key) => ({ before: baseline.entities[key], after: current.entities[key] }));
const report = {
  baselineVersion: baseline.version,
  currentVersion: current.version,
  baselineCount: baseline.entityCount,
  currentCount: current.entityCount,
  added,
  modified,
  removed,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`OK content diff: +${added.length} ~${modified.length} -${removed.length} -> ${path.relative(root, outputPath)}`);
