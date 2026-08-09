const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  buildContentSourceCatalog,
  checkContentSourceCatalog,
  diffContentSourceCatalog,
} = require('./content-source-catalog');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'dist/content-audit/content-source-catalog.json');
const expected = buildContentSourceCatalog();
checkContentSourceCatalog(expected);

if (!fs.existsSync(outputPath)) {
  throw new Error('内容源目录不存在，请先运行 node scripts/build-content-source-catalog.js');
}

const generated = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
checkContentSourceCatalog(generated);
assert.deepStrictEqual(generated, expected, '已生成的内容源目录与当前内容源不一致，请重新构建');

let baseline = generated;
const baselinePath = process.env.CONTENT_SOURCE_CATALOG_BASELINE;
if (baselinePath) {
  const resolvedBaselinePath = path.resolve(baselinePath);
  if (!fs.existsSync(resolvedBaselinePath)) {
    throw new Error(`内容源目录基线不存在：${resolvedBaselinePath}`);
  }
  baseline = JSON.parse(fs.readFileSync(resolvedBaselinePath, 'utf8'));
  checkContentSourceCatalog(baseline);
}

const diff = diffContentSourceCatalog(baseline, expected);
if (process.argv.includes('--require-no-diff')) {
  assert.deepStrictEqual(diff.counts, { added: 0, modified: 0, removed: 0 }, '内容源目录存在未审阅差异');
}
console.log(
  `OK content source catalog: ${generated.entityCount} entities, ${generated.aliasCount} aliases, `
  + `diff +${diff.counts.added} ~${diff.counts.modified} -${diff.counts.removed}`,
);
