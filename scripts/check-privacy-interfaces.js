const fs = require('fs');
const path = require('path');

const PRIVACY_INTERFACE_POLICY = Object.freeze({
  'components/content-block/index.js': { purpose: '复制单个知识内容块', writes: 1 },
  'pages/profile/index.js': { purpose: '复制备份文本和备案查询地址', writes: 2 },
  'packages/math/pages/knowledge/index.js': { purpose: '复制数学知识核心内容', writes: 1 },
  'packages/english/pages/knowledge/index.js': { purpose: '复制英语知识核心内容', writes: 1 },
  'packages/physics/pages/knowledge/index.js': { purpose: '复制物理知识核心内容', writes: 1 },
  'packages/chemistry/pages/knowledge/index.js': { purpose: '复制化学核心知识', writes: 1 },
  'packages/biology/pages/knowledge/index.js': { purpose: '复制生物核心知识', writes: 1 },
});

const RUNTIME_ROOTS = ['pages', 'packages', 'components', 'utils'];
const CLIPBOARD_READ_PATTERN = /\bwx\.getClipboardData\s*\(/g;
const CLIPBOARD_WRITE_PATTERN = /\bwx\.setClipboardData\s*\(/g;

function shouldSkip(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  return normalized.endsWith('.test.js')
    || normalized.startsWith('dist/')
    || normalized.startsWith('node_modules/')
    || normalized.startsWith('packages/catalog/data/');
}

function walkJavaScriptFiles(rootDir, currentDir = rootDir) {
  return fs.readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(currentDir, entry.name);
    const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join('/');
    if (shouldSkip(relativePath)) return [];
    if (entry.isDirectory()) return walkJavaScriptFiles(rootDir, absolutePath);
    return entry.isFile() && entry.name.endsWith('.js') ? [relativePath] : [];
  });
}

function getRuntimeFiles(rootDir) {
  const files = [];
  const appPath = path.join(rootDir, 'app.js');
  if (fs.existsSync(appPath)) files.push('app.js');
  RUNTIME_ROOTS.forEach((directory) => {
    const absolutePath = path.join(rootDir, directory);
    if (fs.existsSync(absolutePath)) files.push(...walkJavaScriptFiles(rootDir, absolutePath));
  });
  return [...new Set(files)].sort();
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function scanPrivacyInterfaces(rootDir, options = {}) {
  const files = options.files ? [...options.files].sort() : getRuntimeFiles(rootDir);
  const writesByFile = {};
  const errors = new Set();
  let readCalls = 0;
  let writeCalls = 0;

  files.forEach((relativePath) => {
    const absolutePath = path.join(rootDir, relativePath);
    if (!fs.existsSync(absolutePath)) return;
    const source = fs.readFileSync(absolutePath, 'utf8');
    const fileReadCalls = countMatches(source, CLIPBOARD_READ_PATTERN);
    const fileWriteCalls = countMatches(source, CLIPBOARD_WRITE_PATTERN);
    readCalls += fileReadCalls;
    writeCalls += fileWriteCalls;
    if (fileReadCalls) errors.add('clipboard-read-forbidden');
    if (fileWriteCalls) {
      writesByFile[relativePath] = fileWriteCalls;
      if (!Object.prototype.hasOwnProperty.call(PRIVACY_INTERFACE_POLICY, relativePath)) {
        errors.add('clipboard-write-file-not-registered');
      }
    }
  });

  Object.entries(PRIVACY_INTERFACE_POLICY).forEach(([relativePath, policy]) => {
    const actualWrites = writesByFile[relativePath] || 0;
    if (actualWrites !== policy.writes) errors.add('registered-file-call-count-mismatch');
  });

  return {
    status: errors.size ? 'failed' : 'passed',
    clipboard: {
      readCalls,
      writeCalls,
      writesByFile,
      allowedFiles: Object.keys(PRIVACY_INTERFACE_POLICY).sort(),
    },
    errors: [...errors].sort(),
  };
}

function main() {
  const report = scanPrivacyInterfaces(path.resolve(__dirname, '..'));
  if (report.status === 'passed') {
    console.log(`OK privacy interfaces: Clipboard write-only, ${report.clipboard.writeCalls} writes, ${report.clipboard.readCalls} reads`);
    return;
  }
  console.error(`BLOCKED privacy interfaces: ${report.errors.join(', ')}`);
  process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  PRIVACY_INTERFACE_POLICY,
  getRuntimeFiles,
  scanPrivacyInterfaces,
};
