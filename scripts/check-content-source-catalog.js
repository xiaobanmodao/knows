const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { buildContentSourceCatalog, checkContentSourceCatalog } = require('./content-source-catalog');

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
console.log(`OK content source catalog: ${generated.entityCount} entities, ${generated.aliasCount} aliases`);
