const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const issues = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function resolveRequire(fromFile, request) {
  if (!request.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), request);
  return [base, `${base}.js`, path.join(base, 'index.js')].find(fs.existsSync) || null;
}

function requiredFiles(file) {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)]
    .map((match) => resolveRequire(file, match[1]))
    .filter(Boolean);
}

const mainRoots = ['app.js', 'pages', 'components', 'utils', 'data']
  .flatMap((entry) => {
    const absolute = path.join(root, entry);
    return fs.statSync(absolute).isDirectory() ? walk(absolute) : [absolute];
  })
  .filter((file) => file.endsWith('.js'));

mainRoots.forEach((file) => {
  requiredFiles(file).forEach((dependency) => {
    if (dependency.startsWith(path.join(root, 'packages') + path.sep)) {
      issues.push(`主包引用了分包内容: ${path.relative(root, file)} -> ${path.relative(root, dependency)}`);
    }
  });
});

const packageRoots = ['english', 'physics', 'math'];
packageRoots.forEach((subjectId) => {
  const packageRoot = path.join(root, 'packages', subjectId);
  walk(packageRoot).filter((file) => file.endsWith('.js')).forEach((file) => {
    requiredFiles(file).forEach((dependency) => {
      const packagesRoot = path.join(root, 'packages') + path.sep;
      if (dependency.startsWith(packagesRoot) && !dependency.startsWith(packageRoot + path.sep)) {
        issues.push(`分包交叉引用: ${path.relative(root, file)} -> ${path.relative(root, dependency)}`);
      }
    });
  });
});

const configuredPackages = appConfig.subPackages || [];
if (appConfig.preloadRule) {
  issues.push('v1.4 不应配置自动预下载 preloadRule');
}

packageRoots.forEach((subjectId) => {
  const config = configuredPackages.find((item) => item.root === `packages/${subjectId}` && item.name === subjectId);
  if (!config || config.pages.length !== 5) {
    issues.push(`app.json 缺少完整 ${subjectId} 普通分包配置`);
  }
});

if (issues.length) {
  console.log('FOUND_PACKAGE_BOUNDARY_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log('OK main package isolation, 3 package boundaries and no preload rule checked');
