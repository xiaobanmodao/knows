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
assert.ok(!defaultCommands.some((item) => item.script === 'scripts/check-package-sizes.js'));
assert.ok(strictCommands.some((item) => item.script === 'scripts/check-release-readiness.js'));
assert.ok(strictCommands.some((item) => item.args.includes('--require-device-evidence')));

console.log('OK v1.11 quality matrix contract');
