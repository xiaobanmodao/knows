const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { SUBJECT_MANIFEST, getSubjectRegistry } = require('../data/subject-manifest');

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

const staleMatches = [];
visibleFiles.forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  stalePatterns.forEach((pattern) => {
    if (pattern.test(source)) staleMatches.push(`${file} 仍含过期学科文案 ${pattern}`);
  });
});
assert.deepStrictEqual(staleMatches, [], `发现 ${staleMatches.length} 处过期学科文案:\n${staleMatches.join('\n')}`);

function loadPage(modulePath) {
  let page;
  global.Page = (config) => { page = config; };
  delete require.cache[require.resolve(modulePath)];
  require(modulePath);
  return page;
}

function assertDynamicPageCopy(expectedNames) {
  const homePage = loadPage('../pages/index/index');
  let homeData = {};
  homePage.onLoad.call({ setData(value) { homeData = value; } });
  assert.strictEqual(homeData.subjectCount, expectedNames.length);
  assert.strictEqual(homeData.subjectNames, expectedNames.join(' · '));
  assert.strictEqual(homeData.subjectNamesText, expectedNames.join('、'));

  const profilePage = loadPage('../pages/profile/index');
  assert.strictEqual(profilePage.data.subjectNamesText, expectedNames.join('、'));
}

const names = getSubjectRegistry().map((subject) => subject.shortName);
assertDynamicPageCopy(names);

const futureSubject = {
  id: 'synthetic-future',
  name: '初中生物',
  shortName: '生物',
  status: 'active',
  packageRoot: 'packages/synthetic-future',
  packagePages: ['pages/index/index'],
  routes: { subject: '/packages/synthetic-future/pages/index/index' },
  contentTypes: ['subject'],
  counts: { knowledge: 1 },
};
SUBJECT_MANIFEST.push(futureSubject);
try {
  assertDynamicPageCopy([...names, futureSubject.shortName]);
} finally {
  SUBJECT_MANIFEST.pop();
  delete global.Page;
}

console.log(`OK ${names.length}-subject and synthetic future-subject dynamic student copy checked`);
