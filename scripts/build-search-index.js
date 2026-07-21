const fs = require('fs');
const path = require('path');
const { buildSearchIndex, renderSearchIndexModule } = require('./search-index-builder');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'data/search-index.js');
const index = buildSearchIndex();

fs.writeFileSync(outputPath, renderSearchIndexModule(index));
console.log(`OK generated ${index.meta.entryCount} search entries -> data/search-index.js`);
