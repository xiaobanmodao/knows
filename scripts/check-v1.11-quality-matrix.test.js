const assert = require('assert');

const {
  DEFAULT_CHECKS,
  RELEASE_CHECKS,
  getCheckCommands,
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
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-chemistry-build-contract.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-biology-build-contract.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input-audit.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input-cli.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input-batches.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-follow-up.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-content-source-follow-up.test.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/content-source-input-manifest.test.js'));
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
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-english-topic-review.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-english-template-review.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-subject-adapters.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-runtime-package-dependencies.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-remote-assets.js'));
assert.ok(defaultCommands.some((item) => item.script === 'scripts/check-release-tool-state.test.js'));
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

console.log('OK v1.11 quality matrix contract');
