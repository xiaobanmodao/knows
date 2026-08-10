const fs = require('fs');
const path = require('path');

const { buildContentSourceCatalog, checkContentSourceCatalog } = require('./content-source-catalog');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'dist/content-audit/content-source-catalog.json');
const catalog = buildContentSourceCatalog();
checkContentSourceCatalog(catalog);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`OK wrote ${path.relative(root, outputPath)} (${catalog.entityCount} entities, ${catalog.aliasCount} aliases)`);
