const fs = require('fs');
const path = require('path');

const { buildContentRoute } = require('../utils/content-routes');

const root = path.resolve(__dirname, '..');
const issues = [];
const routeChecks = [
  [{ subjectId: 'math', type: 'subject' }, '/packages/math/pages/index/index'],
  [{ subjectId: 'math', type: 'chapter', id: 'ch11-triangle' }, '/packages/math/pages/chapter/index?id=ch11-triangle&subjectId=math'],
  [{ subjectId: 'english', type: 'unit', id: 'eng-unit-g7a-starter-1' }, '/packages/english/pages/unit/index?id=eng-unit-g7a-starter-1&subjectId=english'],
  [{ subjectId: 'english', type: 'word', id: 'eng-unit-g8a-u1', focusId: 'eng-word-sample' }, '/packages/english/pages/unit/index?id=eng-unit-g8a-u1&subjectId=english&focusType=word&focusId=eng-word-sample'],
  [{ subjectId: 'english', type: 'grammar', id: 'eng-unit-g9a-u1', focusId: 'eng-grammar-sample' }, '/packages/english/pages/unit/index?id=eng-unit-g9a-u1&subjectId=english&focusType=grammar&focusId=eng-grammar-sample'],
  [{ subjectId: 'physics', type: 'chapter', id: 'phy-ch17-ohm-law' }, '/packages/physics/pages/chapter/index?id=phy-ch17-ohm-law&subjectId=physics'],
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

if (issues.length) {
  console.log('FOUND_CONTENT_ROUTE_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log(`OK ${routeChecks.length} routes and ${legacyPages.length} legacy path shims checked`);
