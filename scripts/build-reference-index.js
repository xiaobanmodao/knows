const fs = require('fs');
const path = require('path');
const {
  buildReferenceIndex,
  renderReferenceIndexMetaModule,
  renderReferenceIndexModule,
} = require('./reference-index-builder');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'packages/catalog/data/reference-index.js');
const metaPath = path.join(root, 'data/reference-index-meta.js');
const index = buildReferenceIndex();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, renderReferenceIndexModule(index));
fs.writeFileSync(metaPath, renderReferenceIndexMetaModule(index));
console.log(`OK generated ${index.meta.entryCount} reference rows and main metadata`);
