const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const infoPath = path.resolve(root, process.argv[2] || '.codex-output/v1.4-packages-preview.json');

if (!fs.existsSync(infoPath)) {
  throw new Error(`缺少开发者工具预览包体信息: ${path.relative(root, infoPath)}`);
}

const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
const sizes = new Map((info.size && info.size.packages || []).map((item) => [item.name, item.size]));
const limits = new Map([
  ['main', 700 * 1024],
  ['/packages/english/', 1024 * 1024],
  ['/packages/math/', 1024 * 1024],
  ['/packages/physics/', 1024 * 1024],
]);
const issues = [];

limits.forEach((limit, name) => {
  const size = sizes.get(name);
  if (!Number.isFinite(size)) {
    issues.push(`包体报告缺少 ${name}`);
  } else if (size >= limit) {
    issues.push(`${name} 为 ${(size / 1024).toFixed(1)} KiB，超过 ${(limit / 1024).toFixed(0)} KiB 目标`);
  }
});

if (issues.length) {
  console.log('FOUND_PACKAGE_SIZE_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log([...limits.keys()].map((name) => `${name} ${(sizes.get(name) / 1024).toFixed(1)} KiB`).join(' · '));
