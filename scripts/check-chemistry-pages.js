const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function filePath(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), 'utf8');
}

function assertFile(relativePath) {
  assert(fs.existsSync(filePath(relativePath)), `missing chemistry page contract file: ${relativePath}`);
}

const requiredFiles = [
  'packages/chemistry/repository.js',
  'packages/chemistry/pages/index/index.js',
  'packages/chemistry/pages/index/index.json',
  'packages/chemistry/pages/index/index.wxml',
  'packages/chemistry/pages/index/index.wxss',
  'packages/chemistry/pages/topic/index.js',
  'packages/chemistry/pages/topic/index.json',
  'packages/chemistry/pages/topic/index.wxml',
  'packages/chemistry/pages/topic/index.wxss',
  'packages/chemistry/pages/knowledge/index.js',
  'packages/chemistry/pages/knowledge/index.json',
  'packages/chemistry/pages/knowledge/index.wxml',
  'packages/chemistry/pages/knowledge/index.wxss',
  'packages/chemistry/pages/template/index.js',
  'packages/chemistry/pages/template/index.json',
  'packages/chemistry/pages/template/index.wxml',
  'packages/chemistry/pages/template/index.wxss',
];

requiredFiles.forEach(assertFile);

const { themes } = require('../packages/chemistry/data/chemistry-themes');
const { topics } = require('../packages/chemistry/data/chemistry-topics');
const { knowledgeItems } = require('../packages/chemistry/data/chemistry-knowledge');
const { templates } = require('../packages/chemistry/data/chemistry-templates');
const repository = require('../packages/chemistry/repository');

const expectedFunctions = [
  'getSubjectHome',
  'getTopicById',
  'getKnowledgeById',
  'getTemplateById',
  'getKnowledgeContext',
  'getKnowledgeNavigation',
  'getRelatedKnowledge',
];

expectedFunctions.forEach((name) => {
  assert.strictEqual(typeof repository[name], 'function', `repository export ${name}`);
});

const home = repository.getSubjectHome();
assert.strictEqual(home.subject.id, 'chemistry', 'chemistry subject id');
assert.strictEqual(home.subject.status, 'building', 'chemistry must remain hidden until activation');
assert.strictEqual(home.themes.length, 5, 'chemistry theme bands');
assert.strictEqual(home.topics.length, 10, 'chemistry topics');
assert.strictEqual(home.knowledgeCount, 40, 'chemistry home knowledge count');
assert.strictEqual(home.templateCount, 12, 'chemistry home template count');
assert.strictEqual(home.themes.reduce((sum, theme) => sum + theme.topicCount, 0), 10, 'theme topic counts');
assert.strictEqual(home.themes.reduce((sum, theme) => sum + theme.knowledgeCount, 0), 40, 'theme knowledge counts');

themes.forEach((theme) => {
  const resolved = home.themes.find((item) => item.id === theme.id);
  assert(resolved, `home theme ${theme.id}`);
  assert.strictEqual(resolved.topics.length, theme.topicIds.length, `theme topic resolution ${theme.id}`);
  const expectedTemplateCount = new Set(resolved.topics.flatMap((topic) => topic.templateIds)).size;
  assert.strictEqual(resolved.templateCount, expectedTemplateCount, `theme method count ${theme.id}`);
});

topics.forEach((topic) => {
  const resolved = repository.getTopicById(topic.id);
  assert(resolved, `topic resolves ${topic.id}`);
  assert.strictEqual(resolved.knowledgeItems.length, topic.knowledgeIds.length, `topic knowledge resolution ${topic.id}`);
  assert.strictEqual(resolved.templates.length, topic.templateIds.length, `topic template resolution ${topic.id}`);
  assert.strictEqual(resolved.knowledgeCount, 4, `topic knowledge count ${topic.id}`);
});

knowledgeItems.forEach((knowledge) => {
  const resolved = repository.getKnowledgeById(knowledge.id);
  assert(resolved, `knowledge resolves ${knowledge.id}`);
  assert.strictEqual(resolved.id, knowledge.id, `knowledge id ${knowledge.id}`);
  assert.strictEqual(repository.getKnowledgeContext(resolved).id, knowledge.topicId, `knowledge context ${knowledge.id}`);
});

templates.forEach((template) => {
  const resolved = repository.getTemplateById(template.id);
  assert(resolved, `template resolves ${template.id}`);
  assert.strictEqual(resolved.id, template.id, `template id ${template.id}`);
});

assert.strictEqual(repository.getTopicById('missing-topic'), null, 'missing topic returns null');
assert.strictEqual(repository.getKnowledgeById('missing-knowledge'), null, 'missing knowledge returns null');
assert.strictEqual(repository.getTemplateById('missing-template'), null, 'missing template returns null');
assert.strictEqual(repository.getKnowledgeContext(null), null, 'missing context returns null');

const orderedKnowledgeIds = topics.flatMap((topic) => topic.knowledgeIds);
assert.strictEqual(orderedKnowledgeIds.length, 40, 'navigation fixture covers all knowledge');
orderedKnowledgeIds.forEach((knowledgeId, index) => {
  const navigation = repository.getKnowledgeNavigation(knowledgeId);
  assert.strictEqual(navigation.index, index, `navigation index ${knowledgeId}`);
  assert.strictEqual(navigation.count, 40, `navigation count ${knowledgeId}`);
  assert.strictEqual(navigation.previous && navigation.previous.id, orderedKnowledgeIds[index - 1] || null, `navigation previous ${knowledgeId}`);
  assert.strictEqual(navigation.next && navigation.next.id, orderedKnowledgeIds[index + 1] || null, `navigation next ${knowledgeId}`);
});

assert.deepStrictEqual(repository.getKnowledgeNavigation('missing-knowledge'), {
  index: -1,
  count: 40,
  previous: null,
  next: null,
}, 'missing navigation is controlled');

const relatedSource = knowledgeItems.find((item) => item.relatedIds && item.relatedIds.length >= 2);
const related = repository.getRelatedKnowledge(relatedSource, 4);
assert(related.length <= 4, 'related result honors limit');
assert(!related.some((item) => item.id === relatedSource.id), 'related result excludes self');
assert.deepStrictEqual(
  related.slice(0, relatedSource.relatedIds.length).map((item) => item.id),
  relatedSource.relatedIds.slice(0, related.length),
  'explicit related IDs come first',
);
assert.deepStrictEqual(repository.getRelatedKnowledge(null, 4), [], 'missing related source is controlled');
assert.deepStrictEqual(repository.getRelatedKnowledge(relatedSource, 0), [], 'zero related limit');

const firstTopic = repository.getTopicById(topics[0].id);
firstTopic.knowledgeItems[0].title = 'mutated';
assert.notStrictEqual(repository.getTopicById(topics[0].id).knowledgeItems[0].title, 'mutated', 'repository returns isolated clones');

const pageRoots = ['index', 'topic', 'knowledge', 'template'];
pageRoots.forEach((pageName) => {
  const js = read(`packages/chemistry/pages/${pageName}/index.js`);
  const wxml = read(`packages/chemistry/pages/${pageName}/index.wxml`);
  assert(/notFound|errorMessage/.test(js), `${pageName} page exposes controlled missing state`);
  assert(/notFound|errorMessage/.test(wxml), `${pageName} page renders controlled missing state`);
  assert(!/测评|答题|闯关|打卡|学完自测|输出任务|掌握度/.test(wxml), `${pageName} page contains task language`);
});

const knowledgeJson = JSON.parse(read('packages/chemistry/pages/knowledge/index.json'));
assert.strictEqual(knowledgeJson.usingComponents['content-block'], '/components/content-block/index', 'knowledge page content-block registration');
assert.strictEqual(knowledgeJson.usingComponents['reading-settings'], '/components/reading-settings/index', 'knowledge page reading-settings registration');

const knowledgeJs = read('packages/chemistry/pages/knowledge/index.js');
const knowledgeWxml = read('packages/chemistry/pages/knowledge/index.wxml');
assert(knowledgeJs.includes("options.focusType === 'equation'"), 'knowledge page accepts equation focus');
assert(knowledgeJs.includes("options.focusType === 'experiment'"), 'knowledge page accepts experiment focus');
assert(knowledgeJs.includes("options.restore === '1'"), 'knowledge page accepts restore');
assert(knowledgeJs.includes('wx.pageScrollTo'), 'knowledge page scrolls to focus');
assert(knowledgeJs.includes('detailsExpanded: true'), 'direct focus expands details');
assert(knowledgeWxml.includes("item.type === 'equation' ? 'equation-' + item.equationId"), 'equation anchor binding');
assert(knowledgeWxml.includes("item.type === 'experiment' ? 'experiment-' + item.experimentId"), 'experiment anchor binding');
assert(knowledgeWxml.includes('reading-preferences="{{readingPreferences}}"'), 'chemistry content blocks receive reading settings');
assert(knowledgeWxml.includes('<reading-settings'), 'chemistry knowledge page renders reading settings');

const templateJs = read('packages/chemistry/pages/template/index.js');
const templateWxml = read('packages/chemistry/pages/template/index.wxml');
assert(templateJs.includes("type: 'template'"), 'template page stores template type');
assert(templateWxml.includes('example.scenario'), 'template page renders worked scenario');
assert(templateWxml.includes('example.steps'), 'template page renders worked steps');
assert(templateWxml.includes('example.conclusion'), 'template page renders worked conclusion');

const contentBlockJs = read('components/content-block/index.js');
const contentBlockWxml = read('components/content-block/index.wxml');
const contentBlockWxss = read('components/content-block/index.wxss');
['equation', 'safety', 'comparison'].forEach((type) => {
  assert(contentBlockJs.includes(`section.type === '${type}'`), `copy handler supports ${type}`);
  assert(contentBlockWxml.includes(`section.type === '${type}'`), `renderer supports ${type}`);
});
[
  'section.equation',
  'section.condition',
  'section.phenomenon',
  'section.interpretation',
  'section.ratioNote',
  'section.risks',
  'section.rules',
  'section.emergencyNote',
  'section.columns',
  'section.rows',
  'section.scenario',
  'section.steps',
  'section.conclusion',
  'section.purpose',
  'section.apparatus',
  'section.errors',
  'section.safety',
].forEach((field) => assert(contentBlockJs.includes(field), `copy includes visible field ${field}`));
assert(contentBlockWxml.includes('scroll-x="true"'), 'comparison table scrolls horizontally');
assert(/\.comparison-table\s*\{[^}]*min-width:\s*760rpx/s.test(contentBlockWxss), 'comparison table has stable minimum width');
assert(contentBlockJs.includes('section.sentence') && contentBlockJs.includes('section.translation'), 'English example copy remains supported');
assert(contentBlockWxml.includes('{{section.sentence}}') && contentBlockWxml.includes('{{section.translation}}'), 'English example rendering remains supported');
assert(contentBlockJs.includes('section.goal') && contentBlockJs.includes('section.apparatusText'), 'physics experiment copy remains supported');
assert(contentBlockWxml.includes('{{section.goal}}') && contentBlockWxml.includes('{{section.apparatusText}}'), 'physics experiment rendering remains supported');

let componentConfig;
let clipboardText = '';
global.Component = (config) => {
  componentConfig = config;
};
global.wx = {
  setClipboardData(options) {
    clipboardText = options.data;
    if (options.success) options.success();
  },
  showToast() {},
};
require('../components/content-block/index');

function copySection(section) {
  clipboardText = '';
  componentConfig.methods.copySection.call({ data: { section } });
  return clipboardText;
}

assert.strictEqual(copySection({
  type: 'example',
  sentence: 'I study chemistry.',
  translation: '我学习化学。',
  focus: '一般现在时',
  note: '主语为第一人称。',
}), 'I study chemistry.\n我学习化学。\n一般现在时\n主语为第一人称。', 'English example copy semantics');

assert.strictEqual(copySection({
  type: 'experiment',
  title: '物理实验',
  method: '控制变量',
  goal: '观察现象',
  apparatus: ['刻度尺', '秒表'],
  apparatusText: '刻度尺、秒表',
  controlsText: '路程相同',
  steps: ['开始计时', '记录时间'],
  recordsText: '记录三次',
  phenomenon: '时间不同',
  conclusion: '速度不同',
  errors: ['计时反应误差'],
  errorsText: '计时反应误差',
  safety: '保持通道畅通',
}), [
  '物理实验',
  '方法：控制变量',
  '目的：观察现象',
  '器材：刻度尺、秒表',
  '控制：路程相同',
  '1. 开始计时',
  '2. 记录时间',
  '记录：记录三次',
  '现象：时间不同',
  '结论：速度不同',
  '误差：计时反应误差',
  '安全：保持通道畅通',
].join('\n'), 'physics experiment copy semantics');

const chemistryCopyFixtures = [
  [{
    type: 'example', title: '示例', scenario: '观察反应', steps: ['记录颜色', '解释证据'], conclusion: '形成证据链',
  }, ['示例', '情境：观察反应', '1. 记录颜色', '2. 解释证据', '结论：形成证据链']],
  [{
    type: 'experiment', title: '化学实验', purpose: '验证性质', apparatus: ['试管', '滴管'], steps: ['规范取样'], phenomenon: '产生气泡', conclusion: '发生反应', errors: ['装置漏气'], safety: '教师指导',
  }, ['化学实验', '目的：验证性质', '器材：试管、滴管', '1. 规范取样', '现象：产生气泡', '结论：发生反应', '误差：装置漏气', '安全：教师指导']],
  [{
    type: 'equation', title: '水的电解', equation: '2H2O -> 2H2(g) + O2(g)', condition: '通电', phenomenon: '产生气体', interpretation: '原子重新组合', ratioNote: '2:2:1',
  }, ['水的电解', '方程式：2H2O -> 2H2(g) + O2(g)', '条件：通电', '现象：产生气体', '解释：原子重新组合', '比例：2:2:1']],
  [{
    type: 'safety', title: '安全', risks: ['飞溅'], rules: ['佩戴护目镜'], emergencyNote: '立即报告教师',
  }, ['安全', '风险：飞溅', '规则 1：佩戴护目镜', '应急：立即报告教师']],
  [{
    type: 'comparison', title: '比较', columns: ['物质', '性质'], rows: [['氧气', '助燃'], ['二氧化碳', '不燃烧']],
  }, ['比较', '物质 | 性质', '氧气 | 助燃', '二氧化碳 | 不燃烧']],
];

chemistryCopyFixtures.forEach(([section, visibleLines]) => {
  assert.deepStrictEqual(copySection(section).split('\n'), visibleLines, `${section.type} copy includes every visible field`);
});

console.log(`OK chemistry pages: ${home.themes.length} themes, ${home.topics.length} topics, ${knowledgeItems.length} knowledge items, ${templates.length} templates and focus/copy contracts checked`);
