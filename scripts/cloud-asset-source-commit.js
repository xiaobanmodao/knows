const { execFileSync } = require('child_process');
const path = require('path');

const SOURCE_COMMIT_PATTERN = /^[a-f0-9]{7,64}$/i;
const DEFAULT_INPUT_PATHS = [
  'data',
  'packages',
  'scripts/asset-inventory.js',
  'utils/asset-config.js',
];

function assertCloudAssetSourceCommitIntegrity({
  repositoryRoot,
  sourceCommit,
  sourcePaths,
  inputPaths = DEFAULT_INPUT_PATHS,
}) {
  const root = path.resolve(repositoryRoot || '');
  if (!repositoryRoot || !SOURCE_COMMIT_PATTERN.test(sourceCommit || '')) {
    throw new Error('资源提交标识无效');
  }
  const normalizedSourcePaths = normalizePaths(sourcePaths);
  const normalizedInputPaths = normalizePaths(inputPaths);

  const head = runGit(root, ['rev-parse', 'HEAD'], '无法读取当前 Git 提交');
  if (head !== sourceCommit) throw new Error('资源提交与当前 Git 提交不一致');

  try {
    execFileSync('git', ['diff', '--quiet', sourceCommit, '--', ...new Set([
      ...normalizedInputPaths,
      ...normalizedSourcePaths,
    ])], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (error && error.status === 1) throw new Error('资源输入存在未提交修改');
    throw new Error('无法检查资源输入 Git 状态');
  }

  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', ...normalizedSourcePaths], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    throw new Error('资源原图未由当前 Git 提交跟踪');
  }
  return true;
}

function normalizePaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0) throw new Error('资源输入路径无效');
  const normalized = paths.map((value) => {
    if (
      typeof value !== 'string'
      || !value
      || path.isAbsolute(value)
      || value.startsWith('-')
      || value.split(/[\\/]/).includes('..')
    ) {
      throw new Error('资源输入路径无效');
    }
    return value.replace(/\\/g, '/');
  });
  return [...new Set(normalized)];
}

function runGit(root, args, failureMessage) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    throw new Error(failureMessage);
  }
}

module.exports = {
  assertCloudAssetSourceCommitIntegrity,
};
