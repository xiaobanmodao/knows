const { getSubjectRegistry } = require('./subject-manifest');

const PACKAGE_SIZE_LIMIT_BYTES = 1024 * 1024;
const TOOL_PACKAGES = [
  {
    id: 'catalog',
    name: '知识目录',
    root: 'packages/catalog',
    kind: 'tool',
    pages: ['pages/search/index', 'pages/reference-index/index'],
    routes: {
      search: '/packages/catalog/pages/search/index',
      referenceIndex: '/packages/catalog/pages/reference-index/index',
    },
    sizeLimitBytes: PACKAGE_SIZE_LIMIT_BYTES,
  },
];

function clonePackage(item) {
  return {
    ...item,
    pages: [...(item.pages || [])],
    routes: { ...(item.routes || {}) },
  };
}

function getPackageRegistry({ includeBuilding = false } = {}) {
  const subjectPackages = getSubjectRegistry({ includeBuilding }).map((subject) => ({
    id: subject.id,
    name: subject.name,
    root: subject.packageRoot,
    kind: 'subject',
    pages: [...subject.packagePages],
    routes: { ...subject.routes },
    sizeLimitBytes: PACKAGE_SIZE_LIMIT_BYTES,
  }));
  return [...TOOL_PACKAGES.map(clonePackage), ...subjectPackages.map(clonePackage)];
}

function getPackageMeta(packageId, options) {
  const item = getPackageRegistry(options).find((entry) => entry.id === packageId);
  return item ? clonePackage(item) : null;
}

module.exports = {
  PACKAGE_SIZE_LIMIT_BYTES,
  TOOL_PACKAGES,
  getPackageRegistry,
  getPackageMeta,
};
