const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const { getPackageRegistry } = require('../data/package-manifest');
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

const packageRegistry = getPackageRegistry();
packageRegistry.forEach((packageMeta) => {
  const packageRoot = path.join(root, packageMeta.root);
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
  issues.push('不应配置自动预下载 preloadRule');
}

packageRegistry.forEach((packageMeta) => {
  const matches = configuredPackages.filter((item) => (
    item.root === packageMeta.root && item.name === packageMeta.id
  ));
  if (matches.length !== 1 || JSON.stringify(matches[0].pages) !== JSON.stringify(packageMeta.pages)) {
    issues.push(`app.json 分包 ${packageMeta.id} 与包注册表不一致`);
  }
});
if (configuredPackages.length !== packageRegistry.length) {
  issues.push(`app.json 配置 ${configuredPackages.length} 个分包，包注册表要求 ${packageRegistry.length} 个`);
}
configuredPackages.forEach((configuredPackage) => {
  const packageMeta = packageRegistry.find((item) => item.root === configuredPackage.root);
  if (!packageMeta
    || configuredPackage.name !== packageMeta.id
    || JSON.stringify(configuredPackage.pages) !== JSON.stringify(packageMeta.pages)) {
    issues.push(`app.json 包含未注册或不一致的分包 ${configuredPackage.root || '(空)'}`);
  }
});

['data/search-index.js', 'data/reference-index.js'].forEach((file) => {
  if (fs.existsSync(path.join(root, file))) {
    issues.push(`主包仍包含完整索引: ${file}`);
  }
});
const referenceMetaSource = fs.readFileSync(path.join(root, 'data/reference-index-meta.js'), 'utf8');
if (referenceMetaSource.includes('REFERENCE_INDEX_ROWS')) {
  issues.push('data/reference-index-meta.js 不得包含完整参考索引行');
}

if (issues.length) {
  console.log('FOUND_PACKAGE_BOUNDARY_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK main package isolation, ${packageRegistry.length} package boundaries and no preload rule checked`);
