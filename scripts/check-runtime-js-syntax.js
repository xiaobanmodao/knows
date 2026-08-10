const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RUNTIME_DIRECTORIES = Object.freeze([
  'pages',
  'components',
  'utils',
  'data',
  'packages',
]);

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function isRuntimeJavaScriptFile(fileName) {
  return fileName.endsWith('.js') && !fileName.endsWith('.test.js');
}

function walkRuntimeJavaScriptFiles(rootDir, currentDir) {
  if (!fs.existsSync(currentDir)) return [];

  return fs.readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) return walkRuntimeJavaScriptFiles(rootDir, absolutePath);
    if (!entry.isFile() || !isRuntimeJavaScriptFile(entry.name)) return [];
    return [normalizePath(path.relative(rootDir, absolutePath))];
  });
}

function getRuntimeJavaScriptFiles(rootDir) {
  const files = [];
  const appPath = path.join(rootDir, 'app.js');
  if (fs.existsSync(appPath) && fs.statSync(appPath).isFile()) {
    files.push('app.js');
  }

  RUNTIME_DIRECTORIES.forEach((directory) => {
    files.push(...walkRuntimeJavaScriptFiles(rootDir, path.join(rootDir, directory)));
  });

  return [...new Set(files)].sort((left, right) => left.localeCompare(right));
}

function checkRuntimeJavaScriptSyntax(rootDir) {
  const files = getRuntimeJavaScriptFiles(rootDir);
  const failures = [];

  files.forEach((relativePath) => {
    const absolutePath = path.join(rootDir, relativePath);
    const result = spawnSync(process.execPath, ['--check', absolutePath], { encoding: 'utf8' });
    if (result.status === 0 && !result.error) return;
    failures.push({
      file: relativePath,
      output: `${result.stdout || ''}${result.stderr || ''}${result.error ? result.error.message : ''}`.trim(),
    });
  });

  return {
    status: failures.length ? 'failed' : 'passed',
    files,
    failures,
  };
}

function formatRuntimeJavaScriptSyntaxReport(report) {
  if (report.status === 'passed') {
    return `OK runtime JavaScript syntax: ${report.files.length} files checked`;
  }
  return [
    `BLOCKED runtime JavaScript syntax: ${report.failures.length}/${report.files.length} files failed`,
    ...report.failures.map((failure) => `${failure.file}\n${failure.output}`),
  ].join('\n');
}

function main() {
  const report = checkRuntimeJavaScriptSyntax(path.resolve(__dirname, '..'));
  const output = formatRuntimeJavaScriptSyntaxReport(report);
  if (report.status === 'passed') {
    console.log(output);
    return;
  }
  console.error(output);
  process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FOUND_RUNTIME_JS_SYNTAX_ISSUE\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  RUNTIME_DIRECTORIES,
  checkRuntimeJavaScriptSyntax,
  formatRuntimeJavaScriptSyntaxReport,
  getRuntimeJavaScriptFiles,
};
