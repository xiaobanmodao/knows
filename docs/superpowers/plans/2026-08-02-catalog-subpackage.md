# Catalog Subpackage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move global search and reference-index pages, full generated indexes, and query code into an on-demand `catalog` ordinary subpackage while keeping old links compatible and reducing the main package below 700 KiB.

**Architecture:** A lightweight main-package registry describes both tool and subject packages, while a shared navigation primitive opens either content routes or catalog routes with identical loading, failure, and retry behavior. The catalog subpackage owns the two full indexes and their runtime queries; the main package retains only generated reference-kind metadata for the profile page and lightweight compatibility shims for historical paths.

**Tech Stack:** WeChat Mini Program CommonJS JavaScript, WXML/WXSS, ordinary subpackages, static generated JS indexes, Node.js executable check scripts, WeChat Developer Tools CLI and simulators.

## Global Constraints

- Keep search entity count at exactly `895`, including exactly `833` pre-chemistry entries and `62` chemistry entries.
- Keep the materialized reference index at exactly `238` rows and the user-visible reference total at exactly `658` entries.
- Preserve search source hashes, stable keys, ranking behavior, aliases, query parameters, and reference target IDs.
- Main package must be strictly below `700 * 1024` bytes in one fresh Developer Tools preview report.
- `catalog`, math, English, physics, and chemistry packages must each be strictly below `1024 * 1024` bytes in the same report.
- Do not add `preloadRule`; catalog loads only when a user first enters search or a reference index.
- Keep `/pages/search/index` and `/pages/reference-index/index` registered as lightweight redirect shims.
- Direct application entries must use `/packages/catalog/...`; old main-package paths exist only for historical links.
- Keep local storage schema version `4`; do not alter or upload favorites, recents, notes, tags, reading positions, backups, or search history.
- Do not add knowledge content, accounts, cloud search, synchronization, automatic preloading, or independent subpackages.
- Do not stage or rewrite the already-uncommitted `README.md`, release-route document, package-size/release/search-experience scripts, release-info file, or v1.7 implementation record unless a task below explicitly names the file and the current diff is first preserved.
- Every production change follows a demonstrated red-green cycle, and every commit stages an explicit file list rather than `git add .`.

---

## File Map

**Create**

- `data/package-manifest.js`: lightweight registry for `catalog` and active/building subject packages.
- `data/reference-index-meta.js`: generated main-package reference metadata without full rows.
- `utils/catalog-routes.js`: catalog URL builder and opener.
- `packages/catalog/data/search-index.js`: generated full search rows, moved from main.
- `packages/catalog/data/reference-index.js`: generated full reference rows, moved from main.
- `packages/catalog/utils/search-index.js`: search query and ranking logic, moved from main.
- `packages/catalog/utils/reference-index.js`: reference query logic, moved from main.
- `packages/catalog/pages/search/index.{js,json,wxml,wxss}`: full search experience, moved from main.
- `packages/catalog/pages/reference-index/index.{js,json,wxml,wxss}`: full reference-index experience, moved from main.
- `scripts/check-package-manifest.js`: package-registry contract checks.
- `scripts/check-student-copy.js`: dynamic subject-copy and stale-string checks.

**Modify**

- `app.json`: register the `catalog` ordinary subpackage while retaining old routes.
- `utils/content-routes.js`: export `appendQuery()` and shared `openRoute()`; delegate `openContent()`.
- `utils/legacy-route-page.js`: support either a content item or a direct resolved URL.
- `utils/subjects.js`: remain lightweight by dropping the runtime search-index dependency.
- `pages/search/index.{js,json,wxml,wxss}`: replace full page with a lightweight redirect shim.
- `pages/reference-index/index.{js,json,wxml,wxss}`: replace full page with a lightweight redirect shim.
- `pages/index/index.{js,wxml}`: direct catalog search route and dynamic subject descriptions.
- `pages/profile/index.{js,wxml}`: use lightweight metadata, direct catalog route, and dynamic subject description.
- `packages/math/pages/index/index.js`: open catalog search directly.
- `packages/english/pages/index/index.js`: open catalog search directly.
- `packages/english/pages/unit/index.js`: open keyword search directly.
- `packages/physics/pages/index/index.js`: open catalog search directly.
- `scripts/build-search-index.js`: generate the full search module inside catalog.
- `scripts/build-reference-index.js`: generate full catalog rows and lightweight main metadata together.
- `scripts/reference-index-builder.js`: render the metadata-only module.
- `scripts/check-content-routes.js`: catalog URL, navigation, shim, and direct-entry coverage.
- `scripts/check-search-index.js`: new generated/runtime/page paths and main-package absence assertions.
- `scripts/check-search-semantics.js`: import catalog runtime query code.
- `scripts/check-search-experience.js`: import catalog runtime query code.
- `scripts/check-english-units.js`: import catalog runtime query code separately from lightweight subject helpers.
- `scripts/check-physics-curriculum.js`: import catalog runtime query code separately from lightweight subject helpers.
- `scripts/check-subject-content.js`: import catalog runtime query code separately from lightweight subject helpers.
- `scripts/check-reference-index.js`: full/metadata path, hash, page, and profile assertions.
- `scripts/check-package-boundaries.js`: validate all package kinds and enforce cross-package isolation.
- `scripts/check-package-sizes.js`: derive all package limits from the package registry.
- `scripts/check-release-readiness.js`: validate app subpackages against the registry and reject preloading.
- `README.md`: document catalog structure and add the two new checks after implementation evidence exists.
- `docs/v1.7化学基础包实施记录.md`: record the fresh package report and simulator evidence without rewriting existing chemistry evidence.

**Delete after migration**

- `data/search-index.js`
- `data/reference-index.js`
- `utils/search-index.js`
- `utils/reference-index.js`

---

### Task 1: Lightweight Package Registry

**Files:**
- Create: `scripts/check-package-manifest.js`
- Create: `data/package-manifest.js`

**Interfaces:**
- Consumes: `getSubjectRegistry(options)` from `data/subject-manifest.js`.
- Produces: `getPackageRegistry(options?): PackageMeta[]`.
- Produces: `getPackageMeta(packageId, options?): PackageMeta | null`.
- `PackageMeta` is `{ id, name, root, kind, pages, routes, sizeLimitBytes }` and `kind` is exactly `tool | subject`.

- [ ] **Step 1: Write the failing package-registry check**

Create `scripts/check-package-manifest.js` with exact active-package, unknown-ID, defensive-copy, and building-subject assertions:

```js
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
```

- [ ] **Step 2: Run the check and verify the missing-module failure**

Run: `node scripts/check-package-manifest.js`

Expected: FAIL with `Cannot find module '../data/package-manifest'`.

- [ ] **Step 3: Implement the registry without loading subject content**

Create `data/package-manifest.js`:

```js
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
```

- [ ] **Step 4: Run the package-registry and subject-registry checks**

Run: `node scripts/check-package-manifest.js`

Run: `node scripts/check-subject-registry.js`

Expected: both PASS; package lookup returns `null` for unknown IDs while existing subject fallback behavior remains unchanged.

- [ ] **Step 5: Commit only the registry contract**

```bash
git add data/package-manifest.js scripts/check-package-manifest.js
git commit -m "feat(packages): add lightweight package registry"
```

---

### Task 2: Shared Navigation Primitive and Catalog Router

**Files:**
- Modify: `scripts/check-content-routes.js`
- Modify: `utils/content-routes.js`
- Create: `utils/catalog-routes.js`
- Modify: `utils/legacy-route-page.js`

**Interfaces:**
- Produces: `appendQuery(route, query): string` as an exported public helper.
- Produces: `openRoute(url, options?): string` with `replace`, `loading`, `retry`, `success`, and `fail` options.
- Produces: `buildCatalogRoute(routeId, query?): string`.
- Produces: `openCatalogRoute(routeId, query?, options?): string`.
- Extends: `createLegacyRoutePage({ resolveItem?, resolveUrl?, loadingText? })` while preserving all existing `resolveItem` callers.

- [ ] **Step 1: Add failing route-contract assertions**

Add these imports and checks to `scripts/check-content-routes.js` before existing route fixtures are removed:

```js
const {
  buildCatalogRoute,
  openCatalogRoute,
} = require('../utils/catalog-routes');
const { appendQuery, openRoute } = require('../utils/content-routes');

if (appendQuery('/target', { q: '欧姆定律', empty: '', zero: 0 }) !== '/target?q=%E6%AC%A7%E5%A7%86%E5%AE%9A%E5%BE%8B&zero=0') {
  issues.push('appendQuery 未保留 0 或未编码中文参数');
}
if (buildCatalogRoute('search', { q: '化学方程式', subjectId: 'chemistry' })
  !== '/packages/catalog/pages/search/index?q=%E5%8C%96%E5%AD%A6%E6%96%B9%E7%A8%8B%E5%BC%8F&subjectId=chemistry') {
  issues.push('catalog 搜索路由不匹配');
}
if (buildCatalogRoute('referenceIndex', { kind: 'equation' })
  !== '/packages/catalog/pages/reference-index/index?kind=equation') {
  issues.push('catalog 参考索引路由不匹配');
}
let rejectedUnknownCatalogRoute = false;
try {
  buildCatalogRoute('unknown');
} catch (error) {
  rejectedUnknownCatalogRoute = /unknown/.test(error.message);
}
if (!rejectedUnknownCatalogRoute) issues.push('未知 catalog routeId 必须抛出明确错误');
```

Add a navigation retry fixture that permits only one retry:

```js
const navigationCalls = [];
const modalCalls = [];
global.wx = {
  showLoading() { navigationCalls.push('showLoading'); },
  hideLoading() { navigationCalls.push('hideLoading'); },
  navigateTo({ url, fail, complete }) {
    navigationCalls.push(url);
    fail(new Error('mock download failure'));
    complete();
  },
  showModal(options) {
    modalCalls.push({ confirmText: options.confirmText, showCancel: options.showCancel });
    options.success({ confirm: true });
  },
};
const openedCatalogUrl = openCatalogRoute('search', { q: '欧姆定律' });
if (openedCatalogUrl !== '/packages/catalog/pages/search/index?q=%E6%AC%A7%E5%A7%86%E5%AE%9A%E5%BE%8B') {
  issues.push('openCatalogRoute 返回 URL 错误');
}
if (navigationCalls.filter((item) => item.startsWith('/packages/catalog/')).length !== 2) {
  issues.push('导航失败后必须只重试一次');
}
if (modalCalls.length !== 2 || modalCalls[0].showCancel !== true || modalCalls[1].showCancel !== false) {
  issues.push('第一次失败应提供重试，第二次失败应停止重试');
}
delete global.wx;
```

- [ ] **Step 2: Run the route check and verify missing exports/modules**

Run: `node scripts/check-content-routes.js`

Expected: FAIL because `utils/catalog-routes.js`, exported `appendQuery`, or exported `openRoute` does not exist.

- [ ] **Step 3: Extract `openRoute()` and delegate existing content navigation**

Refactor `utils/content-routes.js` so `openContent()` only builds the URL and delegates:

```js
function openRoute(url, options = {}) {
  const method = options.replace ? 'redirectTo' : 'navigateTo';
  const retry = options.retry !== false;

  if (options.loading !== false) wx.showLoading({ title: '正在打开', mask: true });
  wx[method]({
    url,
    success(result) {
      if (typeof options.success === 'function') options.success(result);
    },
    fail(error) {
      if (typeof options.fail === 'function') {
        options.fail(error, url);
        return;
      }
      wx.showModal({
        title: '内容暂未打开',
        content: '请检查网络后重试，已保留当前页面。',
        confirmText: retry ? '重试' : '知道了',
        showCancel: retry,
        success(modalResult) {
          if (retry && modalResult.confirm) openRoute(url, { ...options, retry: false });
        },
      });
    },
    complete() {
      if (options.loading !== false) wx.hideLoading();
    },
  });
  return url;
}

function openContent(item, options = {}) {
  return openRoute(buildContentRoute(item), options);
}
```

Export `appendQuery` and `openRoute` alongside the existing route API.

- [ ] **Step 4: Add the catalog URL router**

Create `utils/catalog-routes.js`:

```js
const { getPackageMeta } = require('../data/package-manifest');
const { appendQuery, openRoute } = require('./content-routes');

function getCatalogRoutes() {
  const catalog = getPackageMeta('catalog');
  return catalog ? catalog.routes : {};
}

function buildCatalogRoute(routeId, query = {}) {
  const route = getCatalogRoutes()[routeId];
  if (!route) throw new Error(`Unknown catalog route: ${routeId}`);
  return appendQuery(route, query);
}

function openCatalogRoute(routeId, query = {}, options = {}) {
  return openRoute(buildCatalogRoute(routeId, query), options);
}

module.exports = { buildCatalogRoute, openCatalogRoute };
```

- [ ] **Step 5: Extend legacy page creation without changing old callers**

Update `utils/legacy-route-page.js` to import `openRoute` and select one resolver explicitly:

```js
const { openContent, openRoute } = require('./content-routes');

function createLegacyRoutePage({ resolveItem, resolveUrl, loadingText = '正在打开内容' }) {
  if (typeof resolveItem !== 'function' && typeof resolveUrl !== 'function') {
    throw new Error('Legacy route page requires resolveItem or resolveUrl');
  }
  return {
    data: { loadingText, failed: false, targetUrl: '' },
    onLoad(options) {
      this.legacyOptions = options || {};
      this.openTarget();
    },
    openTarget() {
      this.setData({ failed: false, loadingText });
      const navigationOptions = {
        replace: true,
        fail: (error, failedUrl) => this.setData({ failed: true, targetUrl: failedUrl }),
      };
      const targetUrl = typeof resolveUrl === 'function'
        ? openRoute(resolveUrl(this.legacyOptions || {}), navigationOptions)
        : openContent(resolveItem(this.legacyOptions || {}), navigationOptions);
      this.setData({ targetUrl });
    },
    retry() { this.openTarget(); },
  };
}
```

- [ ] **Step 6: Run route and existing compatibility checks**

Run: `node scripts/check-content-routes.js`

Run: `node scripts/check-release-readiness.js`

Expected: both PASS; all existing content routes remain byte-for-byte identical and catalog retry stops after the second failure.

- [ ] **Step 7: Commit the route foundation**

```bash
git add utils/content-routes.js utils/catalog-routes.js utils/legacy-route-page.js scripts/check-content-routes.js
git commit -m "feat(routes): add catalog navigation foundation"
```

---

### Task 3: Catalog Pages, Direct Entries, and Historical Path Shims

**Files:**
- Modify: `app.json`
- Move: `pages/search/index.{js,json,wxml,wxss}` to `packages/catalog/pages/search/`
- Move: `pages/reference-index/index.{js,json,wxml,wxss}` to `packages/catalog/pages/reference-index/`
- Create: `pages/search/index.{js,json,wxml,wxss}` as a shim
- Create: `pages/reference-index/index.{js,json,wxml,wxss}` as a shim
- Modify: `pages/index/index.js`
- Modify: `packages/math/pages/index/index.js`
- Modify: `packages/english/pages/index/index.js`
- Modify: `packages/english/pages/unit/index.js`
- Modify: `packages/physics/pages/index/index.js`
- Modify: `pages/profile/index.js`
- Modify: `scripts/check-content-routes.js`

**Interfaces:**
- Consumes: `openCatalogRoute()` and `buildCatalogRoute()` from Task 2.
- Produces: registered catalog pages at `/packages/catalog/pages/search/index` and `/packages/catalog/pages/reference-index/index`.
- Preserves: old `q`, `subjectId`, and `kind` URL contracts through redirect shims.

- [ ] **Step 1: Add failing app-config, direct-entry, and shim checks**

Extend `scripts/check-content-routes.js` with exact catalog package and source assertions:

```js
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const catalogConfig = (appConfig.subPackages || []).find((item) => item.name === 'catalog');
if (!catalogConfig || catalogConfig.root !== 'packages/catalog'
  || JSON.stringify(catalogConfig.pages) !== JSON.stringify(['pages/search/index', 'pages/reference-index/index'])) {
  issues.push('app.json 缺少完整 catalog 普通分包');
}

['search', 'reference-index'].forEach((name) => {
  const source = fs.readFileSync(path.join(root, `pages/${name}/index.js`), 'utf8');
  if (!source.includes('createLegacyRoutePage') || !source.includes('buildCatalogRoute')) {
    issues.push(`旧 catalog 路径不是统一 URL 兼容页: pages/${name}/index`);
  }
});

const directEntryFiles = [
  'pages/index/index.js',
  'pages/profile/index.js',
  'packages/math/pages/index/index.js',
  'packages/english/pages/index/index.js',
  'packages/english/pages/unit/index.js',
  'packages/physics/pages/index/index.js',
];
directEntryFiles.forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (/['"`]\/pages\/(search|reference-index)\/index/.test(source)) {
    issues.push(`新入口仍指向旧主包路径: ${file}`);
  }
});
```

Add shim runtime cases with a `wx.redirectTo` mock and assert these exact targets:

```js
const legacyCatalogCases = [
  ['search', { q: '欧姆定律', subjectId: 'physics' }, '/packages/catalog/pages/search/index?q=%E6%AC%A7%E5%A7%86%E5%AE%9A%E5%BE%8B&subjectId=physics'],
  ['search', { q: '化学方程式', subjectId: 'chemistry' }, '/packages/catalog/pages/search/index?q=%E5%8C%96%E5%AD%A6%E6%96%B9%E7%A8%8B%E5%BC%8F&subjectId=chemistry'],
  ['reference-index', { kind: 'equation' }, '/packages/catalog/pages/reference-index/index?kind=equation'],
];
```

- [ ] **Step 2: Run the route check and verify catalog configuration is absent**

Run: `node scripts/check-content-routes.js`

Expected: FAIL for missing catalog subpackage, full main pages instead of shims, and old direct-entry URLs.

- [ ] **Step 3: Register the catalog ordinary subpackage**

Add this object as the first `app.json.subPackages` entry and do not add `preloadRule`:

```json
{
  "root": "packages/catalog",
  "name": "catalog",
  "pages": [
    "pages/search/index",
    "pages/reference-index/index"
  ]
}
```

- [ ] **Step 4: Move both full pages and correct their main-package imports**

Preserve history with:

```bash
mkdir -p packages/catalog/pages/search packages/catalog/pages/reference-index
git mv pages/search/index.js packages/catalog/pages/search/index.js
git mv pages/search/index.json packages/catalog/pages/search/index.json
git mv pages/search/index.wxml packages/catalog/pages/search/index.wxml
git mv pages/search/index.wxss packages/catalog/pages/search/index.wxss
git mv pages/reference-index/index.js packages/catalog/pages/reference-index/index.js
git mv pages/reference-index/index.json packages/catalog/pages/reference-index/index.json
git mv pages/reference-index/index.wxml packages/catalog/pages/reference-index/index.wxml
git mv pages/reference-index/index.wxss packages/catalog/pages/reference-index/index.wxss
```

For this independently runnable task, point the moved page scripts to current main modules; Task 4 and Task 5 will move those query modules into catalog:

```js
// packages/catalog/pages/search/index.js
const { getSubjectRegistry, SUBJECT_LABELS } = require('../../../../data/subject-manifest');
const { searchAllSubjects } = require('../../../../utils/search-index');
const { openContent } = require('../../../../utils/content-routes');

// packages/catalog/pages/reference-index/index.js
const { SUBJECT_LABELS } = require('../../../../data/subject-manifest');
const { REFERENCE_KINDS, filterReferenceEntries } = require('../../../../utils/reference-index');
const { openContent } = require('../../../../utils/content-routes');
```

- [ ] **Step 5: Recreate both main routes as explicit URL shims**

Create `pages/search/index.js`:

```js
const { buildCatalogRoute } = require('../../utils/catalog-routes');
const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开搜索',
  resolveUrl: (options) => buildCatalogRoute('search', {
    q: options.q,
    subjectId: options.subjectId,
  }),
}));
```

Create `pages/reference-index/index.js`:

```js
const { buildCatalogRoute } = require('../../utils/catalog-routes');
const { createLegacyRoutePage } = require('../../utils/legacy-route-page');

Page(createLegacyRoutePage({
  loadingText: '正在打开知识索引',
  resolveUrl: (options) => buildCatalogRoute('referenceIndex', { kind: options.kind }),
}));
```

Use this exact WXML for both shim pages:

```xml
<view class="legacy-route">
  <view wx:if="{{!failed}}" class="legacy-route__indicator"></view>
  <view class="legacy-route__title">{{failed ? '暂未打开' : loadingText}}</view>
  <view class="legacy-route__message">{{failed ? '请检查网络后重试，当前页面会保留。' : '首次进入知识目录时需要加载内容。'}}</view>
  <view wx:if="{{failed}}" class="legacy-route__retry" bindtap="retry">重试</view>
</view>
```

Set both shim JSON files to `{"navigationBarTitleText":"正在打开"}` and both WXSS files to `/* Legacy route styles are shared from app.wxss. */`.

- [ ] **Step 6: Replace every current direct entry with the catalog router**

Import `openCatalogRoute` from the correct relative main-package path and replace navigation bodies with these calls:

```js
// pages/index/index.js and packages/math/pages/index/index.js
openSearch() {
  openCatalogRoute('search');
}

// packages/english/pages/index/index.js
openSearch() {
  openCatalogRoute('search', { subjectId: this.subjectId });
}

// packages/physics/pages/index/index.js
openSearch() {
  openCatalogRoute('search', { subjectId: this.subjectId });
}

// packages/english/pages/unit/index.js
openSearch(event) {
  openCatalogRoute('search', {
    subjectId: 'english',
    q: event.currentTarget.dataset.keyword,
  });
}

// pages/profile/index.js
openReference(event) {
  openCatalogRoute('referenceIndex', { kind: event.currentTarget.dataset.kind });
}
```

- [ ] **Step 7: Run route, release, and WXML compile checks**

Run: `node scripts/check-content-routes.js`

Run: `node scripts/check-release-readiness.js`

Run: the Developer Tools `compile_wxml` skill for `packages/catalog/pages/search/index.wxml` and `packages/catalog/pages/reference-index/index.wxml`.

Expected: both Node checks PASS and both moved WXML pages compile with zero errors.

- [ ] **Step 8: Commit catalog pages and routing entries**

```bash
git add app.json pages/search pages/reference-index pages/index/index.js pages/profile/index.js packages/catalog/pages packages/math/pages/index/index.js packages/english/pages/index/index.js packages/english/pages/unit/index.js packages/physics/pages/index/index.js scripts/check-content-routes.js
git commit -m "feat(catalog): move search and reference pages"
```

---

### Task 4: Search Index and Query Migration

**Files:**
- Move: `data/search-index.js` to `packages/catalog/data/search-index.js`
- Move: `utils/search-index.js` to `packages/catalog/utils/search-index.js`
- Modify: `packages/catalog/pages/search/index.js`
- Modify: `scripts/build-search-index.js`
- Modify: `scripts/check-search-index.js`
- Modify: `scripts/check-search-semantics.js`
- Modify: `scripts/check-search-experience.js`
- Modify: `scripts/check-english-units.js`
- Modify: `scripts/check-physics-curriculum.js`
- Modify: `scripts/check-subject-content.js`
- Modify: `utils/subjects.js`

**Interfaces:**
- Preserves: `SEARCH_INDEX_META`, `TYPE_LABELS`, `expandSearchTerms()`, `normalizeSearchText()`, `getSearchIndexEntries()`, and `searchAllSubjects()`.
- Changes only module location to `packages/catalog/utils/search-index.js`.
- Keeps `utils/subjects.js` limited to subject labels, registry/meta, and subject normalization.

- [ ] **Step 1: Add failing location and main-package isolation assertions**

Change `scripts/check-search-index.js` imports and generated path to catalog, and add:

```js
const generatedPath = path.join(root, 'packages/catalog/data/search-index.js');
if (fs.existsSync(path.join(root, 'data/search-index.js'))) {
  issues.push('主包仍包含完整 data/search-index.js');
}
if (fs.existsSync(path.join(root, 'utils/search-index.js'))) {
  issues.push('主包仍包含完整 utils/search-index.js');
}
```

Use these imports:

```js
const { SEARCH_INDEX_META, SEARCH_INDEX_ROWS } = require('../packages/catalog/data/search-index');
const { searchAllSubjects } = require('../packages/catalog/utils/search-index');
```

Change the page contract import to `../packages/catalog/pages/search/index`.

- [ ] **Step 2: Run the search check and verify the new files are missing**

Run: `node scripts/check-search-index.js`

Expected: FAIL because the catalog data and runtime query modules do not exist yet.

- [ ] **Step 3: Move the generated data and runtime module**

Preserve history with:

```bash
mkdir -p packages/catalog/data packages/catalog/utils
git mv data/search-index.js packages/catalog/data/search-index.js
git mv utils/search-index.js packages/catalog/utils/search-index.js
```

Update imports in `packages/catalog/utils/search-index.js` exactly as follows:

```js
const {
  SEARCH_INDEX_META,
  SUBJECT_CODES,
  TYPE_CODES,
  SEARCH_INDEX_ROWS,
} = require('../data/search-index');
const { SUBJECT_LABELS } = require('../../../data/subject-manifest');
const { SEARCH_ALIAS_GROUPS } = require('../../../data/search-aliases');
const { normalizeSubjectId } = require('../../../utils/content-routes');
const { normalizeSearchText } = require('../../../utils/search-text');
```

Update `packages/catalog/pages/search/index.js` to import `searchAllSubjects` from `../../utils/search-index` while retaining main-package manifest and content-router imports.

- [ ] **Step 4: Point the generator at the catalog data directory**

Change `scripts/build-search-index.js` to:

```js
const outputPath = path.join(root, 'packages/catalog/data/search-index.js');
const index = buildSearchIndex();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, renderSearchIndexModule(index));
console.log(`OK generated ${index.meta.entryCount} search entries -> packages/catalog/data/search-index.js`);
```

- [ ] **Step 5: Remove the main runtime dependency and update build-time consumers**

Remove `require('./search-index')` and the `searchAllSubjects` export from `utils/subjects.js`.

In each search-related check, import the query function directly:

```js
const { searchAllSubjects } = require('../packages/catalog/utils/search-index');
```

For `scripts/check-english-units.js`, `scripts/check-physics-curriculum.js`, and `scripts/check-subject-content.js`, retain their existing `utils/subjects` import for lightweight registry helpers and replace only `subjects.searchAllSubjects(...)` calls with `searchAllSubjects(...)`.

- [ ] **Step 6: Rebuild and verify hash, count, ranking, and semantics**

Run: `node scripts/build-search-index.js`

Run: `node scripts/check-search-index.js`

Run: `node scripts/check-search-semantics.js`

Run: `node scripts/check-search-experience.js`

Run: `node scripts/check-english-units.js`

Run: `node scripts/check-physics-curriculum.js`

Run: `node scripts/check-subject-content.js`

Expected: all PASS; search remains `895` entries, pre-chemistry hash remains `e42dc687f1236b1e71fc3ff4ad3c052df4f3deb1fb812a99e2b59b1cf0a5e27a`, and all 49 representative probes retain their top results.

- [ ] **Step 7: Prove the main package no longer owns search rows**

Run: `test ! -e data/search-index.js`

Run: `test ! -e utils/search-index.js`

Run: `rg -n "packages/catalog/(data|utils)/search-index|data/search-index|utils/search-index" app.js pages components utils data`

Expected: both absence checks exit `0`; the final search prints no main-runtime reference to catalog or deleted main index paths.

- [ ] **Step 8: Commit only the search migration**

```bash
git add packages/catalog/data/search-index.js packages/catalog/utils/search-index.js packages/catalog/pages/search/index.js scripts/build-search-index.js scripts/check-search-index.js scripts/check-search-semantics.js scripts/check-search-experience.js scripts/check-english-units.js scripts/check-physics-curriculum.js scripts/check-subject-content.js utils/subjects.js
git add -u data/search-index.js utils/search-index.js
git commit -m "refactor(search): load full index from catalog package"
```

---

### Task 5: Reference Index Migration and Lightweight Main Metadata

**Files:**
- Move: `data/reference-index.js` to `packages/catalog/data/reference-index.js`
- Move: `utils/reference-index.js` to `packages/catalog/utils/reference-index.js`
- Create: `data/reference-index-meta.js` through the build script
- Modify: `packages/catalog/pages/reference-index/index.js`
- Modify: `scripts/reference-index-builder.js`
- Modify: `scripts/build-reference-index.js`
- Modify: `scripts/check-reference-index.js`
- Modify: `pages/profile/index.js`

**Interfaces:**
- Preserves catalog runtime exports: `REFERENCE_INDEX_META`, `REFERENCE_KINDS`, `filterReferenceEntries()`, `getReferenceEntries()`, and `getReferenceStats()`.
- Produces main metadata exports: `REFERENCE_INDEX_META` and `REFERENCE_KIND_META` only.
- Guarantees the full and metadata-only modules share the same `sourceHash` from one `buildReferenceIndex()` call.

- [ ] **Step 1: Add failing full/metadata split assertions**

Update `scripts/check-reference-index.js` to use catalog full modules and main metadata:

```js
const {
  REFERENCE_KIND_META,
  REFERENCE_INDEX_META: MAIN_REFERENCE_INDEX_META,
} = require('../data/reference-index-meta');
const {
  REFERENCE_INDEX_META,
} = require('../packages/catalog/data/reference-index');
const {
  REFERENCE_KINDS,
  filterReferenceEntries,
  getReferenceEntries,
} = require('../packages/catalog/utils/reference-index');
```

Add exact path and metadata assertions:

```js
const outputPath = path.join(root, 'packages/catalog/data/reference-index.js');
const metaPath = path.join(root, 'data/reference-index-meta.js');
if (fs.existsSync(path.join(root, 'data/reference-index.js'))) issue('主包', '仍包含完整 data/reference-index.js');
if (fs.existsSync(path.join(root, 'utils/reference-index.js'))) issue('主包', '仍包含完整 utils/reference-index.js');
const metaSource = fs.readFileSync(metaPath, 'utf8');
if (metaSource.includes('REFERENCE_INDEX_ROWS')) issue('主包元数据', '不得包含完整参考索引行');
if (MAIN_REFERENCE_INDEX_META.sourceHash !== REFERENCE_INDEX_META.sourceHash) {
  issue('源哈希', '主包元数据与 catalog 完整索引不一致');
}
```

Change the page import contract to `../packages/catalog/pages/reference-index/index` and keep the existing 658-entry checks.

- [ ] **Step 2: Run the reference check and verify the metadata module is missing**

Run: `node scripts/check-reference-index.js`

Expected: FAIL because `data/reference-index-meta.js` and the catalog runtime modules do not yet exist.

- [ ] **Step 3: Add a metadata-only renderer**

Add this function to `scripts/reference-index-builder.js` and export it:

```js
function renderReferenceIndexMetaModule(index) {
  const kindMeta = buildReferenceKindMeta(index, getSubjectRegistry());
  return `// Generated by scripts/build-reference-index.js. Do not edit manually.\nconst REFERENCE_INDEX_META=${JSON.stringify(index.meta)};\nconst REFERENCE_KIND_META=${JSON.stringify(kindMeta)};\nmodule.exports={REFERENCE_INDEX_META,REFERENCE_KIND_META};\n`;
}
```

The existing `renderReferenceIndexModule(index)` remains unchanged so its rows and hash semantics do not move.

- [ ] **Step 4: Move the full reference data and runtime query code**

Preserve history with:

```bash
git mv data/reference-index.js packages/catalog/data/reference-index.js
git mv utils/reference-index.js packages/catalog/utils/reference-index.js
```

The moved runtime module keeps same-package imports:

```js
const {
  REFERENCE_INDEX_META,
  REFERENCE_SUBJECT_CODES,
  REFERENCE_KIND_CODES,
  REFERENCE_KIND_META,
  REFERENCE_INDEX_ROWS,
} = require('../data/reference-index');
const { expandSearchTerms, getSearchIndexEntries, normalizeSearchText } = require('./search-index');
```

Update `packages/catalog/pages/reference-index/index.js` to import `../../utils/reference-index`; keep subject labels and `openContent` imports pointed to the main package.

- [ ] **Step 5: Generate both modules from one index object**

Replace the body of `scripts/build-reference-index.js` after imports with:

```js
const {
  buildReferenceIndex,
  renderReferenceIndexMetaModule,
  renderReferenceIndexModule,
} = require('./reference-index-builder');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'packages/catalog/data/reference-index.js');
const metaPath = path.join(root, 'data/reference-index-meta.js');
const index = buildReferenceIndex();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, renderReferenceIndexModule(index));
fs.writeFileSync(metaPath, renderReferenceIndexMetaModule(index));
console.log(`OK generated ${index.meta.entryCount} reference rows and main metadata`);
```

- [ ] **Step 6: Switch the profile page to metadata and direct catalog navigation**

Use these imports in `pages/profile/index.js`:

```js
const { REFERENCE_KIND_META } = require('../../data/reference-index-meta');
const { openCatalogRoute } = require('../../utils/catalog-routes');
```

Keep the existing `referenceItems`, `referenceTotal`, and descriptions. `openReference()` must call `openCatalogRoute('referenceIndex', { kind })` as defined in Task 3.

- [ ] **Step 7: Rebuild and verify all five reference kinds**

Run: `node scripts/build-reference-index.js`

Run: `node scripts/check-reference-index.js`

Expected: PASS with 89 math formulas, 84 physics formulas, 336 words, 84 grammar points, 37 experiments, and 28 equations; full and metadata source hashes match.

- [ ] **Step 8: Prove no full reference rows remain in main**

Run: `test ! -e data/reference-index.js`

Run: `test ! -e utils/reference-index.js`

Run: `! rg -n "REFERENCE_INDEX_ROWS" data/reference-index-meta.js`

Expected: all commands exit `0`.

- [ ] **Step 9: Commit only the reference split**

```bash
git add packages/catalog/data/reference-index.js packages/catalog/utils/reference-index.js packages/catalog/pages/reference-index/index.js data/reference-index-meta.js scripts/reference-index-builder.js scripts/build-reference-index.js scripts/check-reference-index.js pages/profile/index.js
git add -u data/reference-index.js utils/reference-index.js
git commit -m "refactor(reference): split catalog rows from main metadata"
```

---

### Task 6: Dynamic Subject Copy and Package Gates

**Files:**
- Create: `scripts/check-student-copy.js`
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.wxml`
- Modify: `pages/profile/index.js`
- Modify: `pages/profile/index.wxml`
- Modify: `packages/catalog/pages/search/index.wxml`
- Modify: `scripts/check-package-boundaries.js`
- Modify: `scripts/check-package-sizes.js`
- Modify: `scripts/check-release-readiness.js`
- Modify: `README.md`

**Interfaces:**
- Produces homepage data: `subjectCount`, `subjectNames`, and `subjectNamesText`.
- Produces profile data: `subjectNamesText`.
- Consumes: `getPackageRegistry()` as the single package-list source for boundary, size, and release checks.

- [ ] **Step 1: Write the failing student-copy check**

Create `scripts/check-student-copy.js`:

```js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getSubjectRegistry } = require('../data/subject-manifest');

const root = path.resolve(__dirname, '..');
const visibleFiles = [
  'pages/index/index.wxml',
  'pages/profile/index.wxml',
  'packages/catalog/pages/search/index.wxml',
];
const stalePatterns = [
  /三科/,
  /数学、英语和物理/,
  /数学 · 英语 · 物理/,
];
visibleFiles.forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  stalePatterns.forEach((pattern) => assert.ok(!pattern.test(source), `${file} 仍含过期学科文案 ${pattern}`));
});

let homePage;
global.Page = (config) => { homePage = config; };
delete require.cache[require.resolve('../pages/index/index')];
require('../pages/index/index');
let homeData = {};
homePage.onLoad.call({ setData(value) { homeData = value; } });
const names = getSubjectRegistry().map((subject) => subject.shortName);
assert.strictEqual(homeData.subjectCount, names.length);
assert.strictEqual(homeData.subjectNames, names.join(' · '));
assert.strictEqual(homeData.subjectNamesText, names.join('、'));

let profilePage;
global.Page = (config) => { profilePage = config; };
delete require.cache[require.resolve('../pages/profile/index')];
require('../pages/profile/index');
assert.strictEqual(profilePage.data.subjectNamesText, names.join('、'));
delete global.Page;

console.log(`OK ${names.length}-subject dynamic student copy checked`);
```

- [ ] **Step 2: Run the copy check and verify the five stale strings fail**

Run: `node scripts/check-student-copy.js`

Expected: FAIL on the current fixed three-subject text or missing dynamic fields.

- [ ] **Step 3: Build dynamic subject strings on homepage and profile**

In `pages/index/index.js`, initialize the three fields in `data`, then set them in `onLoad()`:

```js
const subjectNames = subjects.map((subject) => subject.shortName);
this.setData({
  subjects,
  subjectCount: subjects.length,
  subjectNames: subjectNames.join(' · '),
  subjectNamesText: subjectNames.join('、'),
  featuredChapters: FEATURED_MATH_CHAPTERS,
  totalChapters: subjects[0].chapterCount,
  totalKnowledge: subjects.reduce((sum, subject) => (
    sum + subject.knowledgeCount + (subject.vocabularyCount || 0) + (subject.grammarCount || 0)
  ), 0),
});
```

In `pages/profile/index.js`, add:

```js
const subjectNamesText = subjects.map((subject) => subject.shortName).join('、');
```

and expose `subjectNamesText` in page `data`.

- [ ] **Step 4: Replace all five visible stale descriptions**

Use these exact WXML texts:

```xml
<!-- pages/index/index.wxml -->
<view class="hero__desc">面向初中阶段的多学科知识库。无需登录即可搜索、阅读和保存本地笔记。</view>
<view class="hero__stat-label">{{subjectCount}} 科内容条目</view>
<view class="section-title__sub">{{subjectNames}}</view>

<!-- pages/profile/index.wxml -->
<view class="profile-card__desc">当前版本不要求注册登录。收藏、最近浏览、搜索记录都保存在本机，可快速查阅{{subjectNamesText}}知识内容。</view>

<!-- packages/catalog/pages/search/index.wxml -->
<view class="search-note">搜索教材单元、英语单词与语法，以及各学科知识和方法。</view>
```

- [ ] **Step 5: Convert package-boundary checks to the package registry**

In `scripts/check-package-boundaries.js`, replace subject-derived package iteration with:

```js
const { getPackageRegistry } = require('../data/package-manifest');
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
```

Validate every configured package against `packageMeta.root`, `packageMeta.id`, and `packageMeta.pages`. Add explicit assertions that main full index files are absent and `data/reference-index-meta.js` does not contain `REFERENCE_INDEX_ROWS`.

- [ ] **Step 6: Derive precise package limits from the same registry**

Replace `scripts/check-package-sizes.js` subject limits with:

```js
const { getPackageRegistry } = require('../data/package-manifest');

const limits = new Map([
  ['main', 700 * 1024],
  ...getPackageRegistry().map((item) => [`/${item.root}/`, item.sizeLimitBytes]),
]);
```

This must require a report entry for `main`, `/packages/catalog/`, and all four active subject package roots.

- [ ] **Step 7: Make release readiness compare app config to the registry**

Import `getPackageRegistry()` in `scripts/check-release-readiness.js`. After reading `app.json`, assert each registry item has exactly one matching `subPackages` entry with the same `name`, `root`, and ordered `pages`; assert there are no extra configured package roots. Change an existing `preloadRule` from a warning to a release issue.

Use this comparison shape:

```js
const expectedPackages = getPackageRegistry();
const configuredPackages = appConfig.subPackages || [];
expectedPackages.forEach((expected) => {
  const actual = configuredPackages.find((item) => item.name === expected.id && item.root === expected.root);
  if (!actual || JSON.stringify(actual.pages) !== JSON.stringify(expected.pages)) {
    issues.push(`app.json subPackages: ${expected.id} 与包注册表不一致`);
  }
});
if (configuredPackages.length !== expectedPackages.length) {
  issues.push(`app.json subPackages: 配置 ${configuredPackages.length} 个，注册表要求 ${expectedPackages.length} 个`);
}
```

- [ ] **Step 8: Document the new structure and checks without staging unrelated edits**

Update only the relevant README structure/check lines:

```text
- packages/catalog/：按需加载的全局搜索与知识索引工具分包
- data/reference-index-meta.js：主包内仅含参考类型、数量和源哈希的生成元数据
node scripts/check-package-manifest.js
node scripts/check-student-copy.js
```

Before editing `README.md`, save `git diff -- README.md` to a temporary review buffer, apply the minimal additions on top of the user's existing diff, then inspect `git diff -- README.md` to ensure no prior lines were lost.

- [ ] **Step 9: Run focused copy, package, and release checks**

Run: `node scripts/check-student-copy.js`

Run: `node scripts/check-package-manifest.js`

Run: `node scripts/check-package-boundaries.js`

Run: `node scripts/check-release-readiness.js`

Expected: all PASS, five stale descriptions are absent, five packages match the registry, no cross-package imports exist, and no preload rule exists.

- [ ] **Step 10: Commit gates and copy with explicit staging**

```bash
git add pages/index/index.js pages/index/index.wxml pages/profile/index.js pages/profile/index.wxml packages/catalog/pages/search/index.wxml scripts/check-student-copy.js scripts/check-package-boundaries.js scripts/check-package-sizes.js scripts/check-release-readiness.js README.md
git commit -m "chore(packages): enforce catalog boundaries and dynamic copy"
```

---

### Task 7: Full Verification, Exact Preview Sizes, Simulator Regression, Records, and Push

**Files:**
- Modify: `docs/v1.7化学基础包实施记录.md`
- Modify only through Developer Tools output: `.codex-output/v1.7-catalog-packages-preview.json`
- Create through screenshots: `.codex-output/simulator-v17-catalog/*.png`

**Interfaces:**
- No new runtime API.
- Produces exact package-size evidence, two-model visual evidence, console evidence, and an implementation record tied to the final commit.

- [ ] **Step 1: Rebuild both generated indexes from source**

Run: `node scripts/build-search-index.js`

Run: `node scripts/build-reference-index.js`

Run: `git diff --exit-code -- packages/catalog/data/search-index.js packages/catalog/data/reference-index.js data/reference-index-meta.js`

Expected: both builders report the expected counts and the generated files are already current.

- [ ] **Step 2: Run the complete automated suite**

Run each command independently and stop on the first failure:

```bash
node scripts/check-release-readiness.js
node scripts/check-package-manifest.js
node scripts/check-subject-registry.js
node scripts/check-subject-adapters.js
node scripts/check-chemistry-foundations.js
node scripts/check-chemistry-content.js
node scripts/check-chemistry-accuracy.js
node scripts/check-chemistry-pages.js
node scripts/check-chemistry-assets.js
node scripts/check-english-units.js
node scripts/check-english-accuracy.js
node scripts/check-english-depth.js
node scripts/check-physics-curriculum.js
node scripts/check-physics-accuracy.js
node scripts/check-physics-depth.js
node scripts/check-subject-content.js
node scripts/check-math-content.js
node scripts/check-math-accuracy.js
node scripts/check-math-depth.js
node scripts/check-unique-figures.js
node scripts/prepare-remote-assets.js
node scripts/check-remote-assets.js
node scripts/check-content-migration.js
node scripts/check-note-filters.js
node scripts/check-local-backup.js
node scripts/check-reading-display.js
node scripts/check-content-review-meta.js
node scripts/check-search-experience.js
node scripts/check-search-index.js
node scripts/check-search-semantics.js
node scripts/check-reference-index.js
node scripts/check-content-routes.js
node scripts/check-student-copy.js
node scripts/check-package-boundaries.js
node scripts/check-content-schema.js
node scripts/check-content-diff.js
node scripts/check-cloud-assets-runtime.js
```

Expected: every command exits `0`; search is 895 entries, reference display total is 658, and all four subject content checks retain their current counts.

- [ ] **Step 3: Generate one fresh Developer Tools preview report**

Run the installed Developer Tools CLI against this worktree:

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli preview \
  --project /Users/hht/Desktop/knows/.worktrees/chemistry-foundation-v1.7 \
  --qr-format image \
  --qr-output /Users/hht/Desktop/knows/.worktrees/chemistry-foundation-v1.7/.codex-output/v1.7-catalog-preview.png \
  --info-output /Users/hht/Desktop/knows/.worktrees/chemistry-foundation-v1.7/.codex-output/v1.7-catalog-packages-preview.json
```

Do not upload or submit this preview. The command is used only to obtain the code-package report.

- [ ] **Step 4: Enforce all six exact package limits**

Run: `node scripts/check-package-sizes.js .codex-output/v1.7-catalog-packages-preview.json`

Expected: PASS and print `main`, `/packages/catalog/`, `/packages/math/`, `/packages/english/`, `/packages/physics/`, and `/packages/chemistry/`; main is below `700 KiB`, every subpackage is below `1024 KiB`.

- [ ] **Step 5: Regress iPhone 14 Pro Max with exact runtime confirmation**

Select `iPhone 14 Pro Max` in the Developer Tools simulator and verify `automation_runtime_info --action systemInfo` reports model `iPhone 14 Pro Max`, screen `430x932`, and DPR `3`.

Open and capture these pages:

```text
pages/index/index
packages/catalog/pages/search/index?q=化学方程式&subjectId=chemistry
packages/catalog/pages/reference-index/index?kind=equation
packages/chemistry/pages/knowledge/index?id=chem-k-oxygen-preparation&subjectId=chemistry&focusType=experiment&focusId=chem-exp-oxygen
```

Verify safe-area spacing, dynamic four-subject text, catalog first-load behavior, search result grouping, equation cards, focus positioning, return stack, and complete text when cloud images fail. Save screenshots under `.codex-output/simulator-v17-catalog/iphone14-*.png`.

- [ ] **Step 6: Regress Nexus 5 with exact runtime confirmation**

Select `Nexus 5` and verify system info reports model `Nexus 5`, screen `360x640`, and DPR `3`. Repeat the four page cases from Step 5 and save `.codex-output/simulator-v17-catalog/nexus5-*.png`.

Check that filters, long Chinese titles, equations, tags, and retry controls wrap without overlap at the narrow width.

- [ ] **Step 7: Inspect console evidence on both models**

After each model run, execute `get_simulator_console` with:

```text
grep -Ein 'error|fail|exception|warning'
```

Expected: zero project errors. Record Developer Tools or base-library deprecation/preload warnings separately and do not misclassify them as project failures.

- [ ] **Step 8: Record only observed evidence**

Append a `Catalog 分包与主包减重` section to `docs/v1.7化学基础包实施记录.md` containing:

- final search/reference counts and unchanged hash evidence;
- six exact package sizes from the fresh report;
- iPhone 14 Pro Max and Nexus 5 runtime model/screen/DPR values;
- page cases inspected and screenshot directory;
- console result, distinguishing platform warnings from project errors;
- physical iPhone/Android regression still pending unless actual hardware was used.

- [ ] **Step 9: Verify diff scope before the evidence commit**

Run: `git diff --check`

Run: `git status --short --branch`

Run: `git diff --name-status 68f7339..HEAD`

Expected: no whitespace errors, no source assets in the main package, no accidental staging of pre-existing unrelated changes, and only the implementation record remains to commit.

- [ ] **Step 10: Commit the verified record**

```bash
git add docs/v1.7化学基础包实施记录.md
git commit -m "docs: record catalog package verification"
```

- [ ] **Step 11: Re-run final gates after the evidence commit**

Run: `node scripts/check-search-index.js`

Run: `node scripts/check-reference-index.js`

Run: `node scripts/check-content-routes.js`

Run: `node scripts/check-package-boundaries.js`

Run: `node scripts/check-package-sizes.js .codex-output/v1.7-catalog-packages-preview.json`

Run: `node scripts/check-release-readiness.js`

Run: `git status --short --branch`

Expected: every check passes; only previously existing user changes, if any, remain unstaged.

- [ ] **Step 12: Push the feature branch without creating a release tag**

```bash
git push -u origin codex/chemistry-foundation-v1.7
```

Expected: push succeeds. Do not create an RC tag or upload a formal version until physical-device regression and the user's release decision.
