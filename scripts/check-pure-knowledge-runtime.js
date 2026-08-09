const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RUNTIME_FILE_EXTENSIONS = new Set(['.js', '.json', '.wxml', '.wxss']);
const FORBIDDEN_RUNTIME_COPY = [
  '学完自测',
  '单元输出任务',
  '测评任务',
  '在线答题',
  '自动评分',
  '错题本',
  '打卡',
  '家长端',
  '教师端',
  '强制登录',
  '云同步',
  'AI问答',
  '输出任务',
  '学习任务',
  '练习任务',
  '掌握度',
  '自测',
  '测评',
].map((pattern) => ({ pattern, regex: new RegExp(pattern, 'i') }));

function findForbiddenRuntimeCopy(source, file) {
  return String(source).split(/\r?\n/).flatMap((line, index) => FORBIDDEN_RUNTIME_COPY
    .filter(({ regex }) => regex.test(line))
    .map(({ pattern }) => ({ file, line: index + 1, pattern, text: line.trim() })));
}

function collectFiles(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  const stat = fs.statSync(directory);
  if (stat.isFile()) {
    if (RUNTIME_FILE_EXTENSIONS.has(path.extname(directory))) files.push(directory);
    return files;
  }
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    collectFiles(path.join(directory, entry.name), files);
  });
  return files;
}

function collectRuntimeFiles(root = ROOT) {
  const files = [path.join(root, 'app.js'), path.join(root, 'app.json')]
    .filter((file) => fs.existsSync(file));
  ['pages', 'components'].forEach((directory) => {
    collectFiles(path.join(root, directory), files);
  });
  collectFiles(path.join(root, 'packages'), [])
    .filter((file) => path.relative(root, file).split(path.sep).includes('pages'))
    .forEach((file) => {
      if (!files.includes(file)) files.push(file);
    });
  return files.sort();
}

function checkRuntimeCopy(root = ROOT) {
  return collectRuntimeFiles(root).flatMap((file) => findForbiddenRuntimeCopy(
    fs.readFileSync(file, 'utf8'),
    path.relative(root, file),
  ));
}

if (require.main === module) {
  const matches = checkRuntimeCopy();
  assert.deepStrictEqual(matches, [], `运行层含任务化文案:\n${matches.map((item) => (
    `${item.file}:${item.line} ${item.pattern} -> ${item.text}`
  )).join('\n')}`);
  console.log(`OK pure knowledge runtime copy checked (${collectRuntimeFiles().length} files)`);
}

module.exports = {
  FORBIDDEN_RUNTIME_COPY,
  collectRuntimeFiles,
  findForbiddenRuntimeCopy,
  checkRuntimeCopy,
};
