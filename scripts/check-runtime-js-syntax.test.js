const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  checkRuntimeJavaScriptSyntax,
  getRuntimeJavaScriptFiles,
} = require('./check-runtime-js-syntax');

function writeFixtureFile(root, relativePath, source) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, source, 'utf8');
}

function removeFixture(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-runtime-syntax-'));

try {
  writeFixtureFile(fixtureRoot, 'app.js', 'App({});\n');
  writeFixtureFile(fixtureRoot, 'components/content-block/index.js', 'Component({});\n');
  writeFixtureFile(fixtureRoot, 'data/subject-manifest.js', 'module.exports = {};\n');
  writeFixtureFile(fixtureRoot, 'packages/math/pages/index/index.js', 'Page({});\n');
  writeFixtureFile(fixtureRoot, 'pages/index/index.js', 'Page({});\n');
  writeFixtureFile(fixtureRoot, 'utils/storage.js', 'module.exports = {};\n');
  writeFixtureFile(fixtureRoot, 'pages/ignored.test.js', 'const = ;\n');
  writeFixtureFile(fixtureRoot, 'scripts/ignored.js', 'const = ;\n');
  writeFixtureFile(fixtureRoot, 'dist/ignored.js', 'const = ;\n');
  writeFixtureFile(fixtureRoot, 'cloudfunctions/ignored.js', 'const = ;\n');

  const expectedFiles = [
    'app.js',
    'components/content-block/index.js',
    'data/subject-manifest.js',
    'packages/math/pages/index/index.js',
    'pages/index/index.js',
    'utils/storage.js',
  ];
  assert.deepStrictEqual(getRuntimeJavaScriptFiles(fixtureRoot), expectedFiles);

  const validReport = checkRuntimeJavaScriptSyntax(fixtureRoot);
  assert.strictEqual(validReport.status, 'passed');
  assert.deepStrictEqual(validReport.files, expectedFiles);
  assert.deepStrictEqual(validReport.failures, []);

  writeFixtureFile(fixtureRoot, 'packages/math/pages/broken.js', 'const = ;\n');
  const invalidReport = checkRuntimeJavaScriptSyntax(fixtureRoot);
  assert.strictEqual(invalidReport.status, 'failed');
  assert.deepStrictEqual(invalidReport.failures.map((item) => item.file), [
    'packages/math/pages/broken.js',
  ]);
  assert.match(invalidReport.failures[0].output, /SyntaxError/);
} finally {
  removeFixture(fixtureRoot);
}

console.log('OK runtime JavaScript syntax contract');
