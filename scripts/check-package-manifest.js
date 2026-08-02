const assert = require('assert');
const { SUBJECT_MANIFEST } = require('../data/subject-manifest');
const { getPackageMeta, getPackageRegistry } = require('../data/package-manifest');

const activePackages = getPackageRegistry();
assert.deepStrictEqual(
  activePackages.map((item) => item.id),
  ['catalog', 'math', 'english', 'physics', 'chemistry'],
  '默认包清单必须包含 catalog 和四个 active 学科包',
);

const catalog = getPackageMeta('catalog');
assert.deepStrictEqual(catalog, {
  id: 'catalog',
  name: '知识目录',
  root: 'packages/catalog',
  kind: 'tool',
  pages: ['pages/search/index', 'pages/reference-index/index'],
  routes: {
    search: '/packages/catalog/pages/search/index',
    referenceIndex: '/packages/catalog/pages/reference-index/index',
  },
  sizeLimitBytes: 1024 * 1024,
});
assert.strictEqual(getPackageMeta('missing-package'), null, '未知包不得回退到数学');

const math = getPackageMeta('math');
assert.strictEqual(math.kind, 'subject');
assert.strictEqual(math.root, 'packages/math');
assert.deepStrictEqual(math.pages, SUBJECT_MANIFEST[0].packagePages);
math.pages.push('mutated');
assert.ok(!getPackageMeta('math').pages.includes('mutated'), '返回值必须是防御性副本');

const buildingSubject = {
  id: 'synthetic-building',
  name: '构建中学科',
  status: 'building',
  packageRoot: 'packages/synthetic-building',
  packagePages: ['pages/index/index'],
  routes: { subject: '/packages/synthetic-building/pages/index/index' },
  contentTypes: ['subject'],
  counts: {},
};
SUBJECT_MANIFEST.push(buildingSubject);
try {
  assert.strictEqual(getPackageMeta(buildingSubject.id), null);
  assert.strictEqual(getPackageMeta(buildingSubject.id, { includeBuilding: true }).kind, 'subject');
} finally {
  SUBJECT_MANIFEST.pop();
}

console.log('OK catalog and subject package registry checked');
