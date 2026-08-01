const fs = require('fs');
const path = require('path');
const { buildReferenceIndex, renderReferenceIndexModule } = require('./reference-index-builder');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'data/reference-index.js');
const index = buildReferenceIndex();

fs.writeFileSync(outputPath, renderReferenceIndexModule(index));
console.log(`OK generated ${index.meta.entryCount} formula/experiment entries -> data/reference-index.js`);
