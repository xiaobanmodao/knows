const fs = require('fs');
const path = require('path');

const { getPackageRegistry } = require('../data/package-manifest');

const ROOT = path.resolve(__dirname, '..');
const MAIN_PACKAGE_LIMIT_BYTES = 700 * 1024;
const DEFAULT_REPORT = 'dist/content-audit/package-source-estimate.json';
const DEFAULT_IGNORED_DIRECTORIES = new Set(['.git', 'node_modules']);

function normalizeRelative(filePath) {
  return path.posix.normalize(String(filePath).replace(/\\/g, '/'))
    .replace(/^\.\//, '')
    .replace(/\/$/, '');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getIgnoreEntries(projectConfig) {
  return ((projectConfig.packOptions || {}).ignore || [])
    .filter((entry) => entry && entry.value)
    .map((entry) => ({
      type: entry.type || 'file',
      value: normalizeRelative(entry.value),
    }));
}

function isIgnored(relativePath, ignoreEntries) {
  const normalized = normalizeRelative(relativePath);
  const firstSegment = normalized.split('/')[0];
  if (DEFAULT_IGNORED_DIRECTORIES.has(firstSegment)) return true;

  return ignoreEntries.some((entry) => {
    if (entry.type === 'folder') {
      return normalized === entry.value || normalized.startsWith(`${entry.value}/`);
    }
    return normalized === entry.value;
  });
}

function collectFiles(root, ignoreEntries) {
  const files = [];

  function walk(directory, relativeDirectory = '') {
    fs.readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name))
      .forEach((entry) => {
        const relativePath = normalizeRelative(path.posix.join(relativeDirectory, entry.name));
        if (isIgnored(relativePath, ignoreEntries)) return;

        const absolutePath = path.join(root, relativePath);
        if (entry.isDirectory()) {
          walk(absolutePath, relativePath);
        } else if (entry.isFile()) {
          files.push({ relativePath, bytes: fs.statSync(absolutePath).size });
        }
      });
  }

  walk(root);
  return files;
}

function findPackage(relativePath, packageRegistry) {
  return [...packageRegistry]
    .sort((left, right) => right.root.length - left.root.length)
    .find((packageMeta) => (
      relativePath === packageMeta.root
      || relativePath.startsWith(`${packageMeta.root}/`)
    )) || null;
}

function getUnregisteredPackageRoot(relativePath, packageRegistry) {
  if (!relativePath.startsWith('packages/')) return null;
  if (findPackage(relativePath, packageRegistry)) return null;
  const segments = relativePath.split('/');
  return segments.length > 1 ? segments.slice(0, 2).join('/') : 'packages';
}

function buildSourcePackageEstimate({
  root = ROOT,
  projectConfig = readJson(path.join(root, 'project.config.json')),
  packageRegistry = getPackageRegistry(),
  mainLimitBytes = MAIN_PACKAGE_LIMIT_BYTES,
} = {}) {
  const ignoreEntries = getIgnoreEntries(projectConfig);
  const files = collectFiles(root, ignoreEntries);
  const buckets = new Map([
    ['main', {
      name: 'main',
      root: null,
      limitBytes: mainLimitBytes,
      files: [],
    }],
    ...packageRegistry.map((packageMeta) => [packageMeta.id, {
      name: packageMeta.id,
      root: packageMeta.root,
      limitBytes: packageMeta.sizeLimitBytes,
      files: [],
    }]),
  ]);
  const issues = [];
  const unregisteredRoots = new Set();

  files.forEach((file) => {
    const packageMeta = findPackage(file.relativePath, packageRegistry);
    if (packageMeta) {
      buckets.get(packageMeta.id).files.push(file);
      return;
    }

    const unregisteredRoot = getUnregisteredPackageRoot(file.relativePath, packageRegistry);
    if (unregisteredRoot) {
      unregisteredRoots.add(unregisteredRoot);
      return;
    }
    buckets.get('main').files.push(file);
  });

  unregisteredRoots.forEach((packageRoot) => {
    issues.push(`发现未注册分包目录: ${packageRoot}`);
  });

  const packages = [...buckets.values()].map((bucket) => {
    const sortedFiles = bucket.files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
    const bytes = sortedFiles.reduce((total, file) => total + file.bytes, 0);
    if (bytes >= bucket.limitBytes) {
      const limitLabel = bucket.name === 'main' ? '700 KiB' : '1 MiB';
      const displayName = bucket.name === 'main' ? '主包 (main)' : bucket.name;
      issues.push(`${displayName} 源码估算为 ${(bytes / 1024).toFixed(1)} KiB，达到或超过 ${limitLabel} 门限`);
    }
    return {
      name: bucket.name,
      root: bucket.root,
      bytes,
      kib: Number((bytes / 1024).toFixed(1)),
      limitBytes: bucket.limitBytes,
      files: sortedFiles.map((file) => file.relativePath),
    };
  });

  return {
    schemaVersion: 1,
    sourceKind: 'working-tree-runtime-files',
    ignored: [
      ...[...DEFAULT_IGNORED_DIRECTORIES].map((value) => ({ type: 'folder', value })),
      ...ignoreEntries,
    ],
    packages,
    totalBytes: packages.reduce((total, packageMeta) => total + packageMeta.bytes, 0),
    issues,
  };
}

function checkSourcePackageEstimate(options = {}) {
  const report = buildSourcePackageEstimate(options);
  if (report.issues.length) {
    const error = new Error(`源码包体边界检查失败\n${report.issues.join('\n')}`);
    error.report = report;
    throw error;
  }
  return report;
}

function getReportPath(args) {
  const index = args.indexOf('--report');
  return index >= 0 && args[index + 1] ? args[index + 1] : DEFAULT_REPORT;
}

if (require.main === module) {
  try {
    const report = checkSourcePackageEstimate();
    const reportPath = path.resolve(ROOT, getReportPath(process.argv.slice(2)));
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`OK source package estimate: ${report.packages.map((item) => `${item.name} ${item.kib} KiB`).join(' · ')}`);
    console.log(`Report: ${path.relative(ROOT, reportPath)}`);
  } catch (error) {
    console.error(`FOUND_SOURCE_PACKAGE_ESTIMATE_ISSUES\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_REPORT,
  MAIN_PACKAGE_LIMIT_BYTES,
  buildSourcePackageEstimate,
  checkSourcePackageEstimate,
  collectFiles,
  getIgnoreEntries,
  isIgnored,
};
