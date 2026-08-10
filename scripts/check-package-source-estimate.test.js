const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildSourcePackageEstimate,
  checkSourcePackageEstimate,
} = require('./check-package-source-estimate');

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function withProject(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-package-source-'));
  try {
    return callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const packageRegistry = [{
  id: 'math',
  root: 'packages/math',
  sizeLimitBytes: 20,
}];

const realProjectConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'project.config.json'), 'utf8'));
const superpowersFolderIgnores = realProjectConfig.packOptions.ignore.filter((entry) => (
  entry.type === 'folder' && entry.value === '.superpowers'
));

assert.strictEqual(
  superpowersFolderIgnores.length,
  1,
  'project config must ignore the .superpowers development workspace exactly once',
);

withProject((root) => {
  writeFile(root, 'app.js', 'main');
  writeFile(root, 'pages/index/index.js', 'page');
  writeFile(root, 'packages/math/repository.js', 'math');
  writeFile(root, 'assets/figures/generated/math.png', 'ignored source asset');
  writeFile(root, '.codex-output/old-report.json', 'ignored report');
  writeFile(root, '.superpowers/sdd/review.diff', 'ignored development review');
  writeFile(root, '.git/should-not-be-read', 'ignored metadata');

  const report = buildSourcePackageEstimate({
    root,
    projectConfig: {
      packOptions: {
        ignore: [
          { type: 'folder', value: 'assets/figures/generated' },
          { type: 'folder', value: '.codex-output' },
          { type: 'folder', value: '.superpowers' },
        ],
      },
    },
    packageRegistry,
    mainLimitBytes: 100,
  });

  assert.deepStrictEqual(report.issues, []);
  assert.strictEqual(report.packages[0].name, 'main');
  assert.strictEqual(report.packages[0].bytes, 'mainpage'.length);
  assert.strictEqual(report.packages[1].name, 'math');
  assert.strictEqual(report.packages[1].bytes, 'math'.length);
  assert.deepStrictEqual(report.packages[1].files, ['packages/math/repository.js']);
  assert.ok(!report.packages[0].files.some((file) => file.includes('generated')));
  assert.ok(!report.packages[0].files.some((file) => file.startsWith('.superpowers/')));
  assert.ok(!report.packages[0].files.some((file) => file.startsWith('.git/')));
  assert.strictEqual(checkSourcePackageEstimate({
    root,
    projectConfig: {
      packOptions: {
        ignore: [
          { type: 'folder', value: 'assets/figures/generated' },
          { type: 'folder', value: '.codex-output' },
          { type: 'folder', value: '.superpowers' },
        ],
      },
    },
    packageRegistry,
    mainLimitBytes: 100,
  }).schemaVersion, 1);
});

withProject((root) => {
  writeFile(root, 'pages/index/index.js', '123456');
  writeFile(root, 'packages/math/repository.js', '123456789012345678901');
  writeFile(root, 'packages/physics/repository.js', 'unregistered');

  const report = buildSourcePackageEstimate({
    root,
    projectConfig: { packOptions: { ignore: [] } },
    packageRegistry,
    mainLimitBytes: 5,
  });

  assert.ok(report.issues.some((issue) => /主包/.test(issue)));
  assert.ok(report.issues.some((issue) => /math/.test(issue)));
  assert.ok(report.issues.some((issue) => /未注册分包目录/.test(issue)));
  assert.throws(
    () => checkSourcePackageEstimate({
      root,
      projectConfig: { packOptions: { ignore: [] } },
      packageRegistry,
      mainLimitBytes: 5,
    }),
    /源码包体边界检查失败/,
  );
});

console.log('OK source package estimate contract tests');
