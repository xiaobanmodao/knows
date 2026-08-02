const fs = require('fs');
const path = require('path');
const { buildSearchIndex, renderSearchIndexModule } = require('./search-index-builder');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'packages/catalog/data/search-index.js');
const index = buildSearchIndex();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, renderSearchIndexModule(index));
console.log(`OK generated ${index.meta.entryCount} search entries -> packages/catalog/data/search-index.js`);
