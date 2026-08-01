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

const { PACKAGE_ROUTES, buildContentRoute } = require('../utils/content-routes');

const root = path.resolve(__dirname, '..');
const issues = [];
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
