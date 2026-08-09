const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { getPackageRegistry } = require('../data/package-manifest');
const { checkPackageEvidence } = require('./check-release-package-evidence');

function makeReport() {
  return {
    size: {
      packages: [
        { name: 'main', size: 1 },
        ...getPackageRegistry().map((item) => ({ name: `/${item.root}/`, size: 1 })),
      ],
    },
  };
}

function withTempReport(report, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-package-evidence-'));
  const file = path.join(directory, 'packages-preview.json');
  fs.writeFileSync(file, JSON.stringify(report));

  try {
    return callback(file);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

assert.throws(
  () => checkPackageEvidence('/tmp/knows-package-evidence-does-not-exist.json', { required: true }),
  /缺少开发者工具预览包体信息/,
);

assert.match(
  checkPackageEvidence('/tmp/knows-package-evidence-does-not-exist.json'),
  /PENDING release package evidence/,
);

withTempReport({ size: { packages: [{ name: 'main', size: 1 }] } }, (file) => {
  assert.throws(() => checkPackageEvidence(file), /包体报告缺少/);
});

withTempReport(makeReport(), (file) => {
  const result = checkPackageEvidence(file);
  assert.match(result, /main/);
});

console.log('OK release package evidence contract tests');
