const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mainPackageAliasPath = path.join(root, 'data/search-aliases.js');
const catalogAliasPath = path.join(root, 'packages/catalog/data/search-aliases.js');

assert.ok(
  fs.existsSync(catalogAliasPath),
  '搜索别名应随 catalog 分包提供',
);
assert.ok(
  !fs.existsSync(mainPackageAliasPath),
  '搜索别名不应滞留在主包 data 目录',
);

const catalogSearchIndex = fs.readFileSync(
  path.join(root, 'packages/catalog/utils/search-index.js'),
  'utf8',
);
assert.match(
  catalogSearchIndex,
  /require\(['\"]\.\.\/data\/search-aliases['\"]\)/,
  'catalog 搜索索引应引用同分包的别名数据',
);

const semanticCheck = fs.readFileSync(path.join(root, 'scripts/check-search-semantics.js'), 'utf8');
assert.match(
  semanticCheck,
  /require\(['\"]\.\.\/packages\/catalog\/data\/search-aliases['\"]\)/,
  '构建期语义检查应读取 catalog 分包内的别名数据',
);

const { SEARCH_ALIAS_GROUPS } = require(catalogAliasPath);
assert.ok(SEARCH_ALIAS_GROUPS.length > 0, '搜索别名数据不能为空');

console.log(`OK ${SEARCH_ALIAS_GROUPS.length} search alias groups stay in the catalog package`);
