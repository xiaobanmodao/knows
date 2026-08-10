const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  DEFAULT_CHECKS,
  RELEASE_CHECKS,
  getCheckCommands,
  getCheckEnvironment,
  getMatrixEnvironment,
} = require('./check-v1.11-quality-matrix');

const defaultCommands = getCheckCommands(false);
const strictCommands = getCheckCommands(true);

assert.ok(DEFAULT_CHECKS.length >= 20);
assert.ok(RELEASE_CHECKS.length >= 1);
assert.strictEqual(new Set(DEFAULT_CHECKS.map((item) => item.script)).size, DEFAULT_CHECKS.length);
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-chemistry-assets.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/english-curriculum-map.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-pure-knowledge-runtime.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-pure-knowledge-runtime.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-physics-formula-contract.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-english-depth-contract.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/build-math-curriculum-audit.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-math-curriculum-audit.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-math-volume-map-input.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/math-volume-map-diff.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/math-volume-map-review.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-math-smartedu-catalog-evidence.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-math-smartedu-catalog-evidence.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-chemistry-build-contract.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-biology-build-contract.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input-audit.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input-cli.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/build-content-source-external-manifest.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input-batches.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-follow-up.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-content-source-follow-up.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input-manifest.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-intake-pack.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-intake-guide.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/build-content-source-input-manifest.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/build-content-source-follow-up.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/build-content-source-intake-pack.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/build-content-source-intake-guide.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-url-access.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-content-source-batches.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-content-source-batches.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-catalog.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-content-source-catalog.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-subject-high-risk-batches.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-subject-high-risk-batches.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-chemistry-biology-high-risk-batches.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-chemistry-biology-high-risk-batches.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-content-diff.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-subject-content.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-registry.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-english-topic-review.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-english-template-review.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-subject-adapters.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-runtime-package-dependencies.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-remote-assets.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-release-tool-state.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-release-tool-state-evidence.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-release-package-evidence.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-release-regression-evidence.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/run-release-preview.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-roadmap-status.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-roadmap-document-consistency.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-subject-index-fallbacks.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-detail-page-fallbacks.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-catalog-page-fallbacks.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-privacy-interfaces.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-privacy-interfaces.js'));
[
  'scripts/check-package-manifest.js',
  'scripts/check-student-copy.js',
  'scripts/check-search-experience.js',
  'scripts/check-reference-index.js',
  'scripts/check-content-migration.js',
  'scripts/check-note-filters.js',
  'scripts/check-local-backup.js',
  'scripts/check-reading-display.js',
].forEach((script) => {
  assert.ok(defaultCommands.some((item) => item.script === script), `质量矩阵缺少 ${script}`);
});
assert.ok(!defaultCommands.some((item) => item.script === 'scripts/check-package-sizes.js'));
assert.ok(strictCommands.some((item) => item.script === 'scripts/check-release-readiness.js'));
assert.ok(strictCommands.some((item) => item.args.includes('--require-device-evidence')));

const inheritedReleaseEnvironment = {
  RELEASE_TOOL_STATE: '/tmp/tool-state.json',
  RELEASE_REGRESSION_EVIDENCE: '/tmp/evidence.json',
  PACKAGE_SIZE_REPORT: '/tmp/packages-preview.json',
};
const contractEnvironment = getCheckEnvironment(
  { script: 'scripts/check-roadmap-status.test.js' },
  inheritedReleaseEnvironment,
);
Object.keys(inheritedReleaseEnvironment).forEach((key) => {
  assert.strictEqual(contractEnvironment[key], undefined, `契约测试不得继承 ${key}`);
});
const releaseEnvironment = getCheckEnvironment(
  { script: 'scripts/check-release-readiness.js' },
  inheritedReleaseEnvironment,
);
Object.entries(inheritedReleaseEnvironment).forEach(([key, value]) => {
  assert.strictEqual(releaseEnvironment[key], value, `发布检查必须保留 ${key}`);
});

const releaseProject = '/tmp/knows-release-project';
const matrixEnvironment = getMatrixEnvironment(
  ['node', 'check-v1.11-quality-matrix.js', '--require-release-evidence', '--release-project', releaseProject],
  { CI: '1' },
);
assert.strictEqual(matrixEnvironment.CI, '1');
assert.strictEqual(
  matrixEnvironment.RELEASE_TOOL_STATE,
  '/tmp/knows-release-project/.codex-output/release-regression-v1.10.1/tool-state.json',
);
assert.strictEqual(
  matrixEnvironment.RELEASE_REGRESSION_EVIDENCE,
  '/tmp/knows-release-project/.codex-output/release-regression-v1.10.1/evidence.json',
);
assert.strictEqual(
  matrixEnvironment.PACKAGE_SIZE_REPORT,
  '/tmp/knows-release-project/.codex-output/release-regression-v1.10.1/packages-preview.json',
);
assert.throws(
  () => getMatrixEnvironment(['node', 'matrix.js', '--release-project']),
  /--release-project.*路径/,
);

const matrixScripts = new Set(defaultCommands.map((item) => item.script));
const testScripts = fs.readdirSync(__dirname)
  .filter((file) => file.endsWith('.test.js'))
  .map((file) => `scripts/${file}`)
  .sort();
assert.deepStrictEqual(
  testScripts.filter((script) => !matrixScripts.has(script)),
  [],
  'scripts 目录中的契约测试必须全部纳入默认质量矩阵',
);
assert.deepStrictEqual(
  defaultCommands.filter((item) => !fs.existsSync(path.resolve(__dirname, '..', item.script))),
  [],
  '质量矩阵不得登记不存在的脚本',
);

console.log('OK v1.11 quality matrix contract');
