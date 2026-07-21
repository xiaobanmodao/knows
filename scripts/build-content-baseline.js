const fs = require('fs');
const path = require('path');

const { buildContentManifest } = require('./content-manifest');

const output = path.resolve(__dirname, 'fixtures/content-manifest-v1.3.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(buildContentManifest('v1.3.0-rc.1'), null, 2)}\n`);
console.log(`OK wrote ${path.relative(path.resolve(__dirname, '..'), output)}`);
