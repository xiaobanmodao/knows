const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  ALLOWED_HOTFIX_FILES,
  shouldRequireHotfixScope,
  validateReleaseHotfixScope,
} = require('./check-release-hotfix-scope');

assert.strictEqual(shouldRequireHotfixScope([]), false);
assert.strictEqual(shouldRequireHotfixScope(['--require-device-evidence']), false);
assert.strictEqual(shouldRequireHotfixScope(['--require-hotfix-scope']), true);
assert.strictEqual(
  shouldRequireHotfixScope(['--require-device-evidence', '--require-hotfix-scope']),
  true,
);

const readinessSource = fs.readFileSync(
  path.join(__dirname, 'check-release-readiness.js'),
  'utf8',
);
assert.ok(readinessSource.includes('shouldRequireHotfixScope(process.argv.slice(2))'));
assert.match(
  readinessSource,
  /function checkReleaseHotfixScopeTooling\(\) \{\s*if \(!shouldRequireHotfixScope\(process\.argv\.slice\(2\)\)\) \{\s*return;\s*\}/s,
);

const allowedReport = validateReleaseHotfixScope([
  'scripts/check-release-readiness.js',
  'app.js',
  'data/search-aliases.js',
  'docs/v1.10规格确认记录.md',
  'packages/catalog/data/search-aliases.js',
  'packages/catalog/utils/search-index.js',
  'scripts/check-cloud-user-trace.js',
  'scripts/check-cloud-user-trace.test.js',
  'scripts/check-search-aliases-package-boundary.test.js',
  'scripts/check-search-semantics.js',
  'scripts/check-release-hotfix-scope.js',
  'scripts/check-release-hotfix-scope.test.js',
]);
assert.strictEqual(allowedReport.status, 'passed');
assert.deepStrictEqual(allowedReport.unexpectedFiles, []);
assert.deepStrictEqual(allowedReport.allowedFiles, [...ALLOWED_HOTFIX_FILES].sort());

const blockedReport = validateReleaseHotfixScope([
  'app.js',
  'packages/math/data/math.js',
  'packages/english/data/english.js',
]);
assert.strictEqual(blockedReport.status, 'failed');
assert.deepStrictEqual(blockedReport.unexpectedFiles, [
  'packages/english/data/english.js',
  'packages/math/data/math.js',
]);
assert.ok(blockedReport.errors.includes('release-hotfix-file-out-of-scope'));

console.log('OK release hotfix scope contract');
