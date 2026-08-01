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
  'packages/chemistry/content-routes.js',
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
  assert(Array.isArray(resolved.diagramImages) && resolved.diagramImages.length > 0, `topic diagrams resolve ${topic.id}`);
  resolved.diagramImages.forEach((diagram) => {
    assert(diagram.image.startsWith('cloud://'), `topic diagram uses cloud resolver ${topic.id}/${diagram.id}`);
    assert(diagram.title && diagram.caption, `topic diagram preserves text fallback ${topic.id}/${diagram.id}`);
  });
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

const knowledgeWxml = read('packages/chemistry/pages/knowledge/index.wxml');
assert(knowledgeWxml.includes("item.type === 'equation' ? 'equation-' + item.equationId"), 'equation anchor binding');
assert(knowledgeWxml.includes("item.type === 'experiment' ? 'experiment-' + item.experimentId"), 'experiment anchor binding');
assert(knowledgeWxml.includes('reading-preferences="{{readingPreferences}}"'), 'chemistry content blocks receive reading settings');
assert(knowledgeWxml.includes('<reading-settings'), 'chemistry knowledge page renders reading settings');

const templateWxml = read('packages/chemistry/pages/template/index.wxml');
assert(templateWxml.includes('example.scenario'), 'template page renders worked scenario');
assert(templateWxml.includes('example.steps'), 'template page renders worked steps');
assert(templateWxml.includes('example.conclusion'), 'template page renders worked conclusion');

const topicWxml = read('packages/chemistry/pages/topic/index.wxml');
const topicWxss = read('packages/chemistry/pages/topic/index.wxss');
assert(topicWxml.includes('topic.diagramImages'), 'topic page renders diagram collection');
assert(topicWxml.includes('{{diagram.caption}}'), 'topic page keeps diagram meaning in readable text');
assert(topicWxml.includes('binderror="onDiagramError"'), 'topic page handles individual diagram failures');
assert(/\.topic-diagram__media\s*\{[^}]*aspect-ratio:\s*1200\s*\/\s*760/s.test(topicWxss), 'topic diagrams use stable responsive dimensions');

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

const realSetTimeout = global.setTimeout;
const cloudAssets = require('../utils/cloud-assets');
const {
  buildChemistryContentRoute,
  openChemistryContent,
} = require('../packages/chemistry/content-routes');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setDataPath(data, dataPath, value) {
  const parts = dataPath.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cursor = data;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }
    if (!cursor[part]) {
      cursor[part] = /^\d+$/.test(parts[index + 1]) ? [] : {};
    }
    cursor = cursor[part];
  });
}

function createPageInstance(config, eventLog = []) {
  const instance = {
    ...config,
    data: clone(config.data),
    setData(patch, callback) {
      Object.entries(patch).forEach(([key, value]) => setDataPath(this.data, key, value));
      eventLog.push({ type: 'setData', patch });
      if (callback) callback();
    },
  };
  return instance;
}

function createWxMock(options = {}) {
  const calls = {
    events: [],
    navigations: [],
    modals: [],
    scrolls: [],
    loadingShown: 0,
    loadingHidden: 0,
    navigateBack: 0,
  };

  function navigate(method, config) {
    calls.navigations.push({ method, url: config.url });
    calls.events.push({ type: 'navigation', method, url: config.url });
    const shouldFail = options.failFirstNavigation && calls.navigations.length === 1;
    if (shouldFail) {
      if (config.fail) config.fail({ errMsg: 'mock navigation failure' });
    } else if (config.success) {
      config.success({});
    }
    if (config.complete) config.complete();
  }

  return {
    calls,
    api: {
      showLoading() { calls.loadingShown += 1; },
      hideLoading() { calls.loadingHidden += 1; },
      showModal(config) {
        calls.modals.push(config);
        if (config.success) config.success({ confirm: options.confirmRetry !== false, cancel: options.confirmRetry === false });
      },
      navigateTo(config) { navigate('navigateTo', config); },
      redirectTo(config) { navigate('redirectTo', config); },
      navigateBack() { calls.navigateBack += 1; },
      pageScrollTo(config) {
        calls.scrolls.push(config);
        calls.events.push({ type: 'pageScrollTo', config });
      },
      setNavigationBarTitle() {},
      showToast() {},
      getStorageSync() { return ''; },
      setStorageSync() {},
      setClipboardData(config) { if (config.success) config.success(); },
    },
  };
}

function createAppMock(options = {}) {
  const calls = {
    addRecent: [],
    getReadingPosition: [],
    saveReadingPosition: [],
    getKnowledgeNote: [],
    toggleFavorite: [],
    saveKnowledgeNote: [],
  };
  const preferences = {
    version: 1,
    fontSize: 'standard',
    lineHeight: 'standard',
    imageWidth: 'full',
  };

  return {
    calls,
    app: {
      globalData: { favorites: [] },
      refreshSession() {},
      addRecent(item) { calls.addRecent.push(item); },
      getReadingPreferences() { return { ...preferences }; },
      setReadingPreferences(next) { return { saved: true, preferences: next }; },
      resetReadingPreferences() { return { saved: true, preferences: { ...preferences } }; },
      getReadingPosition(subjectId, id) {
        calls.getReadingPosition.push({ subjectId, id });
        return options.readingPosition || null;
      },
      saveReadingPosition(item, scrollTop, viewState) {
        calls.saveReadingPosition.push({ item, scrollTop, viewState });
      },
      getKnowledgeNote(subjectId, id) {
        calls.getKnowledgeNote.push({ subjectId, id });
        return options.note || null;
      },
      toggleFavorite(item) {
        calls.toggleFavorite.push(item);
        return true;
      },
      saveKnowledgeNote(item) {
        calls.saveKnowledgeNote.push(item);
        return item.content ? { content: item.content, tags: item.tags } : null;
      },
    },
  };
}

function loadPageConfig(pageName, assetPromise = Promise.resolve({})) {
  const originalGetTempFileURLMap = cloudAssets.getTempFileURLMap;
  let config;
  cloudAssets.getTempFileURLMap = (paths) => (
    typeof assetPromise === 'function' ? assetPromise(paths) : assetPromise
  );
  global.Page = (value) => {
    config = value;
  };

  const modulePath = require.resolve(`../packages/chemistry/pages/${pageName}/index`);
  delete require.cache[modulePath];
  try {
    require(modulePath);
  } finally {
    cloudAssets.getTempFileURLMap = originalGetTempFileURLMap;
  }
  assert(config, `runtime Page config ${pageName}`);
  return config;
}

function event(id) {
  return { currentTarget: { dataset: { id } } };
}

function deferred() {
  let resolve;
  const promise = new Promise((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function flushAsync() {
  await Promise.resolve();
  await new Promise((resolve) => realSetTimeout(resolve, 0));
}

async function withImmediateTimers(callback) {
  global.setTimeout = (fn) => {
    fn();
    return 0;
  };
  try {
    await callback();
  } finally {
    global.setTimeout = realSetTimeout;
  }
}

function assertLastNavigation(wxMock, method, url, message) {
  const actual = wxMock.calls.navigations[wxMock.calls.navigations.length - 1];
  assert.deepStrictEqual(actual, { method, url }, message);
}

async function runNavigationChecks() {
  assert.strictEqual(
    buildChemistryContentRoute({
      type: 'knowledge',
      id: 'chem id',
      focusType: 'equation',
      focusId: 'eq/1',
      restore: true,
    }),
    '/packages/chemistry/pages/knowledge/index?id=chem%20id&focusType=equation&focusId=eq%2F1&restore=1',
    'package route preserves and encodes focus/restore query semantics',
  );

  let wxMock = createWxMock();
  global.wx = wxMock.api;
  let config = loadPageConfig('index');
  let page = createPageInstance(config, wxMock.calls.events);
  page.openTopic(event(topics[0].id));
  assertLastNavigation(wxMock, 'navigateTo', `/packages/chemistry/pages/topic/index?id=${topics[0].id}`, 'subject to topic URL');

  wxMock = createWxMock();
  global.wx = wxMock.api;
  config = loadPageConfig('topic');
  page = createPageInstance(config, wxMock.calls.events);
  page.openSubjectHome();
  assertLastNavigation(wxMock, 'navigateTo', '/packages/chemistry/pages/index/index', 'topic to subject URL');
  page.openKnowledge(event(topics[0].knowledgeIds[0]));
  assertLastNavigation(wxMock, 'navigateTo', `/packages/chemistry/pages/knowledge/index?id=${topics[0].knowledgeIds[0]}`, 'topic to knowledge URL');
  page.openTemplate(event(topics[0].templateIds[0]));
  assertLastNavigation(wxMock, 'navigateTo', `/packages/chemistry/pages/template/index?id=${topics[0].templateIds[0]}`, 'topic to template URL');

  const appMock = createAppMock();
  wxMock = createWxMock();
  global.wx = wxMock.api;
  global.getApp = () => appMock.app;
  config = loadPageConfig('knowledge');
  page = createPageInstance(config, wxMock.calls.events);
  page.onLoad({ id: relatedSource.id });
  await flushAsync();
  page.openContext();
  assertLastNavigation(wxMock, 'navigateTo', `/packages/chemistry/pages/topic/index?id=${relatedSource.topicId}`, 'knowledge to context URL');
  page.openRelated(event(relatedSource.relatedIds[0]));
  assertLastNavigation(wxMock, 'navigateTo', `/packages/chemistry/pages/knowledge/index?id=${relatedSource.relatedIds[0]}`, 'knowledge to related URL');
  const nextId = repository.getKnowledgeNavigation(relatedSource.id).next.id;
  page.openAdjacent(event(nextId));
  assertLastNavigation(wxMock, 'redirectTo', `/packages/chemistry/pages/knowledge/index?id=${nextId}`, 'knowledge to adjacent URL');
  page.openTemplate(event(relatedSource.templateIds[0]));
  assertLastNavigation(wxMock, 'navigateTo', `/packages/chemistry/pages/template/index?id=${relatedSource.templateIds[0]}`, 'knowledge to template URL');

  const template = templates[0];
  const templateAppMock = createAppMock();
  wxMock = createWxMock();
  global.wx = wxMock.api;
  global.getApp = () => templateAppMock.app;
  config = loadPageConfig('template');
  page = createPageInstance(config, wxMock.calls.events);
  await page.onLoad({ id: template.id });
  page.openTopic(event(template.topicIds[0]));
  assertLastNavigation(wxMock, 'navigateTo', `/packages/chemistry/pages/topic/index?id=${template.topicIds[0]}`, 'template to topic URL');

  wxMock = createWxMock({ failFirstNavigation: true });
  global.wx = wxMock.api;
  openChemistryContent({ type: 'topic', id: topics[0].id });
  assert.strictEqual(wxMock.calls.navigations.length, 2, 'failed package navigation retries once');
  assert.strictEqual(wxMock.calls.modals.length, 1, 'failed package navigation shows one retry dialog');
  assert.strictEqual(wxMock.calls.modals[0].content, '请检查网络后重试，已保留当前页面。', 'failure dialog keeps current page');
  assert.strictEqual(wxMock.calls.navigateBack, 0, 'failed package navigation never leaves current page');
  assert.strictEqual(wxMock.calls.loadingShown, 2, 'retry opens loading state for both attempts');
  assert.strictEqual(wxMock.calls.loadingHidden, 2, 'retry closes loading state for both attempts');
}

async function runFocusChecks() {
  const equationOwner = knowledgeItems.find((knowledge) => knowledge.sections.some((section) => section.type === 'equation'));
  const equation = equationOwner.sections.find((section) => section.type === 'equation');
  const experimentOwner = knowledgeItems.find((knowledge) => knowledge.sections.some((section) => section.type === 'experiment'));
  const experiment = experimentOwner.sections.find((section) => section.type === 'experiment');

  async function assertDirectFocus(knowledge, focusType, focusId) {
    const appMock = createAppMock({ readingPosition: { scrollTop: 640, viewState: { detailsExpanded: false } } });
    const wxMock = createWxMock();
    global.wx = wxMock.api;
    global.getApp = () => appMock.app;
    const config = loadPageConfig('knowledge');
    const page = createPageInstance(config, wxMock.calls.events);

    await withImmediateTimers(async () => {
      page.onLoad({ id: knowledge.id, focusType, focusId, restore: '1' });
      await flushAsync();
    });

    const scrollIndex = wxMock.calls.events.findIndex((item) => item.type === 'pageScrollTo' && item.config.selector === `#${focusType}-${focusId}`);
    assert(scrollIndex >= 0, `${focusType} direct focus scrolls to exact selector`);
    assert(wxMock.calls.events.slice(0, scrollIndex).some((item) => item.type === 'setData' && item.patch.detailsExpanded === true), `${focusType} expands details before scroll`);
    assert(!wxMock.calls.scrolls.some((item) => item.scrollTop === 640), `${focusType} focus takes precedence over restore`);
  }

  await assertDirectFocus(equationOwner, 'equation', equation.equationId);
  await assertDirectFocus(experimentOwner, 'experiment', experiment.experimentId);

  const appMock = createAppMock({ readingPosition: { scrollTop: 520, viewState: { detailsExpanded: false } } });
  const wxMock = createWxMock();
  global.wx = wxMock.api;
  global.getApp = () => appMock.app;
  const config = loadPageConfig('knowledge');
  const page = createPageInstance(config, wxMock.calls.events);
  await withImmediateTimers(async () => {
    page.onLoad({ id: equationOwner.id, restore: '1' });
    await flushAsync();
  });
  assert(wxMock.calls.scrolls.some((item) => item.scrollTop === 520), 'restore-only load scrolls to saved reading position');
  assert(!wxMock.calls.scrolls.some((item) => item.selector), 'restore-only load does not invent a focus selector');
}

async function runTopicDiagramChecks() {
  const diagramTopic = topics.find((item) => item.diagramImages.length >= 2) || topics[0];
  const topic = repository.getTopicById(diagramTopic.id);
  const signed = {};
  topic.diagramImages.forEach((diagram, index) => {
    signed[diagram.image] = `https://signed.example/diagram-${index}.png`;
  });
  signed[topic.coverImage] = 'https://signed.example/cover.png';

  let requestedPaths = [];
  const wxMock = createWxMock();
  global.wx = wxMock.api;
  const config = loadPageConfig('topic', (paths) => {
    requestedPaths = paths;
    return Promise.resolve(signed);
  });
  const page = createPageInstance(config, wxMock.calls.events);
  await page.onLoad({ id: topic.id });

  assert.deepStrictEqual(
    requestedPaths,
    [topic.coverImage, ...topic.diagramImages.map((diagram) => diagram.image)],
    'topic requests cover and every diagram in one cloud batch',
  );
  assert.strictEqual(page.data.topic.coverImage, signed[topic.coverImage], 'topic cover receives signed URL');
  page.data.topic.diagramImages.forEach((diagram, index) => {
    assert.strictEqual(diagram.image, signed[topic.diagramImages[index].image], `diagram receives signed URL ${diagram.id}`);
    assert.strictEqual(diagram.imageLoadFailed, false, `diagram starts in readable image state ${diagram.id}`);
    assert.strictEqual(diagram.caption, topic.diagramImages[index].caption, `diagram keeps caption ${diagram.id}`);
  });

  page.onDiagramError({ currentTarget: { dataset: { index: 0 } } });
  assert.strictEqual(page.data.topic.diagramImages[0].imageLoadFailed, true, 'one diagram failure is isolated');
  assert.strictEqual(page.data.topic.diagramImages[1] && page.data.topic.diagramImages[1].imageLoadFailed, false, 'other diagrams remain visible');

  const fallbackWx = createWxMock();
  global.wx = fallbackWx.api;
  const fallbackConfig = loadPageConfig('topic', Promise.resolve({}));
  const fallbackPage = createPageInstance(fallbackConfig, fallbackWx.calls.events);
  await fallbackPage.onLoad({ id: topic.id });
  fallbackPage.data.topic.diagramImages.forEach((diagram) => {
    assert.strictEqual(diagram.image, '', `cloud failure leaves text-only diagram fallback ${diagram.id}`);
    assert(diagram.title && diagram.caption, `cloud failure preserves readable explanation ${diagram.id}`);
  });
}

async function runIdentityAndMissingChecks() {
  const knowledge = relatedSource;
  let appMock = createAppMock();
  let wxMock = createWxMock();
  global.wx = wxMock.api;
  global.getApp = () => appMock.app;
  let config = loadPageConfig('knowledge');
  let page = createPageInstance(config, wxMock.calls.events);
  page.onLoad({ id: knowledge.id });
  await flushAsync();
  page.toggleFavorite();
  page.setData({ noteDraft: '化学笔记', noteTags: ['方程式'] });
  page.saveNote();

  assert.deepStrictEqual(appMock.calls.addRecent[0], {
    id: knowledge.id,
    title: knowledge.title,
    subtitle: `化学 · ${repository.getKnowledgeContext(knowledge).title}`,
    subjectId: 'chemistry',
    type: 'knowledge',
    containerId: knowledge.topicId,
  }, 'knowledge recent identity');
  assert.deepStrictEqual(appMock.calls.getReadingPosition[0], { subjectId: 'chemistry', id: knowledge.id }, 'knowledge reading-position lookup identity');
  assert(appMock.calls.saveReadingPosition.some((item) => item.item.subjectId === 'chemistry' && item.item.id === knowledge.id), 'knowledge reading-position save identity');
  assert.deepStrictEqual(appMock.calls.getKnowledgeNote[0], { subjectId: 'chemistry', id: knowledge.id }, 'knowledge note lookup identity');
  assert.strictEqual(appMock.calls.toggleFavorite[0].subjectId, 'chemistry', 'knowledge favorite subject identity');
  assert.strictEqual(appMock.calls.toggleFavorite[0].type, 'knowledge', 'knowledge favorite type identity');
  assert.strictEqual(appMock.calls.saveKnowledgeNote[0].subjectId, 'chemistry', 'knowledge note save subject identity');
  assert.strictEqual(appMock.calls.saveKnowledgeNote[0].id, knowledge.id, 'knowledge note save ID');

  const template = templates[0];
  appMock = createAppMock();
  wxMock = createWxMock();
  global.wx = wxMock.api;
  global.getApp = () => appMock.app;
  config = loadPageConfig('template');
  page = createPageInstance(config, wxMock.calls.events);
  await page.onLoad({ id: template.id });
  page.toggleFavorite();
  assert.strictEqual(appMock.calls.addRecent[0].subjectId, 'chemistry', 'template recent subject identity');
  assert.strictEqual(appMock.calls.addRecent[0].type, 'template', 'template recent type identity');
  assert.strictEqual(appMock.calls.addRecent[0].id, template.id, 'template recent ID');
  assert.strictEqual(appMock.calls.toggleFavorite[0].subjectId, 'chemistry', 'template favorite subject identity');
  assert.strictEqual(appMock.calls.toggleFavorite[0].type, 'template', 'template favorite type identity');

  const missingPages = [
    ['topic', { id: 'missing-topic' }],
    ['knowledge', { id: 'missing-knowledge' }],
    ['template', { id: 'missing-template' }],
  ];
  for (const [pageName, loadOptions] of missingPages) {
    appMock = createAppMock();
    wxMock = createWxMock();
    global.wx = wxMock.api;
    global.getApp = () => appMock.app;
    config = loadPageConfig(pageName);
    page = createPageInstance(config, wxMock.calls.events);
    await Promise.resolve(page.onLoad(loadOptions));
    assert(page.data.notFound, `${pageName} missing ID sets a controlled error message`);
    assert.strictEqual(page.data[pageName === 'topic' ? 'topic' : pageName], null, `${pageName} missing ID keeps content null`);
    assert.strictEqual(wxMock.calls.navigations.length, 0, `${pageName} missing ID does not navigate or crash`);
  }
}

async function runUnloadGuardChecks() {
  const fixtures = [
    ['index', {}],
    ['topic', { id: topics[0].id }],
    ['knowledge', { id: knowledgeItems[0].id }],
    ['template', { id: templates[0].id }],
  ];

  for (const [pageName, loadOptions] of fixtures) {
    const assetRequest = deferred();
    const appMock = createAppMock();
    const wxMock = createWxMock();
    global.wx = wxMock.api;
    global.getApp = () => appMock.app;
    const config = loadPageConfig(pageName, assetRequest.promise);
    const page = createPageInstance(config, wxMock.calls.events);
    const loadResult = page.onLoad(loadOptions);
    assert.strictEqual(typeof page.onUnload, 'function', `${pageName} page invalidates pending requests on unload`);
    const beforeUnload = wxMock.calls.events.filter((item) => item.type === 'setData').length;
    page.onUnload();
    assetRequest.resolve({});
    await Promise.resolve(loadResult);
    await flushAsync();
    const afterResolve = wxMock.calls.events.filter((item) => item.type === 'setData').length;
    assert.strictEqual(afterResolve, beforeUnload, `${pageName} late asset resolution does not call setData after unload`);
  }
}

async function main() {
  await runNavigationChecks();
  await runFocusChecks();
  await runTopicDiagramChecks();
  await runIdentityAndMissingChecks();
  await runUnloadGuardChecks();
  console.log(`OK chemistry pages: ${home.themes.length} themes, ${home.topics.length} topics, ${knowledgeItems.length} knowledge items, ${templates.length} templates, runtime routes/lifecycles and focus/copy contracts checked`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
