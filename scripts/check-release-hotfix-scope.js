const { execFileSync } = require('child_process');
const path = require('path');

const ALLOWED_HOTFIX_FILES = Object.freeze([
  'app.js',
  'data/search-aliases.js',
  'docs/v1.10规格确认记录.md',
  'packages/catalog/data/search-aliases.js',
  'packages/catalog/utils/search-index.js',
  'scripts/check-cloud-user-trace.js',
  'scripts/check-cloud-user-trace.test.js',
  'scripts/check-search-aliases-package-boundary.test.js',
  'scripts/check-search-semantics.js',
  'scripts/check-release-readiness.js',
  'scripts/check-release-hotfix-scope.js',
  'scripts/check-release-hotfix-scope.test.js',
]);

function validateReleaseHotfixScope(changedFiles = []) {
  const uniqueFiles = [...new Set(changedFiles.filter(Boolean))].sort();
  const allowedFiles = [...ALLOWED_HOTFIX_FILES].sort();
  const unexpectedFiles = uniqueFiles.filter((file) => !ALLOWED_HOTFIX_FILES.includes(file));
  const errors = unexpectedFiles.length ? ['release-hotfix-file-out-of-scope'] : [];
  return {
    status: errors.length ? 'failed' : 'passed',
    changedFiles: uniqueFiles,
    allowedFiles,
    unexpectedFiles,
    errors,
  };
}

function shouldRequireHotfixScope(args = process.argv.slice(2)) {
  return args.includes('--require-hotfix-scope');
}

function readBaseRef(args) {
  const index = args.indexOf('--base');
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return process.env.RELEASE_HOTFIX_BASE || 'codex/release-regression-v1.10.1';
}

function readChangedFiles(rootDir, baseRef) {
  const diffOutput = execFileSync('git', ['-c', 'core.quotePath=false', 'diff', '--name-only', `${baseRef}...HEAD`], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  const untrackedOutput = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '--others', '--exclude-standard'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  return `${diffOutput}\n${untrackedOutput}`.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const baseRef = readBaseRef(process.argv.slice(2));
  let report;
  try {
    report = validateReleaseHotfixScope(readChangedFiles(rootDir, baseRef));
  } catch (error) {
    console.error(`BLOCKED release hotfix scope: git diff failed for ${baseRef}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (report.status === 'passed') {
    console.log(`OK release hotfix scope: ${report.changedFiles.length} changed files within allowlist`);
    return;
  }
  console.error(`BLOCKED release hotfix scope: ${report.unexpectedFiles.join(', ')}`);
  process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  ALLOWED_HOTFIX_FILES,
  shouldRequireHotfixScope,
  validateReleaseHotfixScope,
};
