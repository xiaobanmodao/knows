const fs = require('fs');
const path = require('path');

const { SUBJECT_MANIFEST } = require('../data/subject-manifest');

const routeFixture = {
  id: 'synthetic-route-subject',
  status: 'active',
  routes: {
    subject: '/packages/synthetic-route-subject/pages/index/index',
    knowledge: '/packages/synthetic-route-subject/pages/knowledge/index',
  },
};
SUBJECT_MANIFEST.push(routeFixture);

const {
  PACKAGE_ROUTES,
  appendQuery,
  buildContentRoute,
  openRoute,
} = require('../utils/content-routes');
const {
  buildCatalogRoute,
  openCatalogRoute,
} = require('../utils/catalog-routes');

const root = path.resolve(__dirname, '..');
const issues = [];
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
  if (/['\"`]\/pages\/(search|reference-index)\/index/.test(source)) {
    issues.push(`新入口仍指向旧主包路径: ${file}`);
  }
});

function openLegacyCatalogPage(name, options) {
  const pagePath = path.join(root, `pages/${name}/index.js`);
  let pageDefinition;
  const redirects = [];
  const previousPage = global.Page;
  const previousWx = global.wx;
  const previousGetApp = global.getApp;

  global.Page = (definition) => {
    pageDefinition = definition;
  };
  global.wx = {
    showLoading() {},
    hideLoading() {},
    redirectTo({ url, complete }) {
      redirects.push(url);
      complete();
    },
  };
  global.getApp = () => ({
    globalData: { searchHistory: [] },
    refreshSession() {},
  });

  delete require.cache[require.resolve(pagePath)];
  require(pagePath);

  const page = {
    ...pageDefinition,
    data: { ...pageDefinition.data },
    setData(data) {
      Object.assign(this.data, data);
    },
  };
  pageDefinition.onLoad.call(page, options);

  global.Page = previousPage;
  global.wx = previousWx;
  global.getApp = previousGetApp;
  delete require.cache[require.resolve(pagePath)];
  return redirects;
}

const legacyCatalogCases = [
  ['search', { q: '欧姆定律', subjectId: 'physics' }, '/packages/catalog/pages/search/index?q=%E6%AC%A7%E5%A7%86%E5%AE%9A%E5%BE%8B&subjectId=physics'],
  ['search', { q: '化学方程式', subjectId: 'chemistry' }, '/packages/catalog/pages/search/index?q=%E5%8C%96%E5%AD%A6%E6%96%B9%E7%A8%8B%E5%BC%8F&subjectId=chemistry'],
  ['reference-index', { kind: 'equation' }, '/packages/catalog/pages/reference-index/index?kind=equation'],
];
legacyCatalogCases.forEach(([name, options, expectedUrl]) => {
  const redirects = openLegacyCatalogPage(name, options);
  if (JSON.stringify(redirects) !== JSON.stringify([expectedUrl])) {
    issues.push(`旧 catalog 路径未保留查询参数: pages/${name}/index`);
  }
});

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
if (JSON.stringify(PACKAGE_ROUTES[routeFixture.id]) !== JSON.stringify(routeFixture.routes)) {
  issues.push('分包路由未从活跃学科清单派生');
}
const expectedPackageRoutes = {
  math: {
    subject: '/packages/math/pages/index/index',
    chapter: '/packages/math/pages/chapter/index',
    topic: '/packages/math/pages/topic/index',
    knowledge: '/packages/math/pages/knowledge/index',
    template: '/packages/math/pages/template/index',
  },
  english: {
    subject: '/packages/english/pages/index/index',
    unit: '/packages/english/pages/unit/index',
    word: '/packages/english/pages/unit/index',
    grammar: '/packages/english/pages/unit/index',
    topic: '/packages/english/pages/topic/index',
    knowledge: '/packages/english/pages/knowledge/index',
    template: '/packages/english/pages/template/index',
  },
  physics: {
    subject: '/packages/physics/pages/index/index',
    chapter: '/packages/physics/pages/chapter/index',
    topic: '/packages/physics/pages/topic/index',
    knowledge: '/packages/physics/pages/knowledge/index',
    template: '/packages/physics/pages/template/index',
  },
  chemistry: {
    subject: '/packages/chemistry/pages/index/index',
    topic: '/packages/chemistry/pages/topic/index',
    knowledge: '/packages/chemistry/pages/knowledge/index',
    template: '/packages/chemistry/pages/template/index',
  },
};
Object.entries(expectedPackageRoutes).forEach(([subjectId, routes]) => {
  if (JSON.stringify(PACKAGE_ROUTES[subjectId]) !== JSON.stringify(routes)) {
    issues.push(`${subjectId} 分包路由与兼容基线不一致`);
  }
});
const routeChecks = [
  [{ subjectId: 'math', type: 'subject' }, '/packages/math/pages/index/index'],
  [{ subjectId: 'math', type: 'chapter', id: 'ch11-triangle' }, '/packages/math/pages/chapter/index?id=ch11-triangle&subjectId=math'],
  [{ subjectId: 'english', type: 'unit', id: 'eng-unit-g7a-starter-1' }, '/packages/english/pages/unit/index?id=eng-unit-g7a-starter-1&subjectId=english'],
  [{ subjectId: 'english', type: 'word', id: 'eng-unit-g8a-u1', focusId: 'eng-word-sample' }, '/packages/english/pages/unit/index?id=eng-unit-g8a-u1&subjectId=english&focusType=word&focusId=eng-word-sample'],
  [{ subjectId: 'english', type: 'grammar', id: 'eng-unit-g9a-u1', focusId: 'eng-grammar-sample' }, '/packages/english/pages/unit/index?id=eng-unit-g9a-u1&subjectId=english&focusType=grammar&focusId=eng-grammar-sample'],
  [{ subjectId: 'physics', type: 'chapter', id: 'phy-ch17-ohm-law' }, '/packages/physics/pages/chapter/index?id=phy-ch17-ohm-law&subjectId=physics'],
  [{ subjectId: 'physics', type: 'knowledge', id: 'phy-ch03-melting-freezing', focusType: 'experiment', focusId: 'phy-ch03-melting-freezing-experiment' }, '/packages/physics/pages/knowledge/index?id=phy-ch03-melting-freezing&subjectId=physics&focusType=experiment&focusId=phy-ch03-melting-freezing-experiment'],
  [{ subjectId: 'chemistry', type: 'subject' }, '/packages/chemistry/pages/index/index'],
  [{ subjectId: 'chemistry', type: 'topic', id: 'chem-topic-lab' }, '/packages/chemistry/pages/topic/index?id=chem-topic-lab&subjectId=chemistry'],
  [{ subjectId: 'chemistry', type: 'knowledge', id: 'chem-k-oxygen-preparation', focusType: 'experiment', focusId: 'chem-exp-oxygen' }, '/packages/chemistry/pages/knowledge/index?id=chem-k-oxygen-preparation&subjectId=chemistry&focusType=experiment&focusId=chem-exp-oxygen'],
  [{ subjectId: 'chemistry', type: 'template', id: 'chem-tpl-equation-balancing' }, '/packages/chemistry/pages/template/index?id=chem-tpl-equation-balancing&subjectId=chemistry'],
  [{ type: 'knowledge', id: 'legacy-math-id', restore: true }, '/packages/math/pages/knowledge/index?id=legacy-math-id&subjectId=math&restore=1'],
];

routeChecks.forEach(([item, expected]) => {
  const actual = buildContentRoute(item);
  if (actual !== expected) {
    issues.push(`路由不匹配: ${JSON.stringify(item)} -> ${actual}，期望 ${expected}`);
  }
});

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

const legacyPages = [
  'math', 'subject', 'chapter', 'english-unit', 'physics-chapter', 'topic', 'knowledge', 'template',
];

legacyPages.forEach((name) => {
  const source = fs.readFileSync(path.join(root, `pages/${name}/index.js`), 'utf8');
  if (!source.includes('createLegacyRoutePage')) {
    issues.push(`旧路径未使用统一兼容跳转页: pages/${name}/index`);
  }
});

SUBJECT_MANIFEST.pop();

if (issues.length) {
  console.log('FOUND_CONTENT_ROUTE_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK ${routeChecks.length} routes and ${legacyPages.length} legacy path shims checked`);
