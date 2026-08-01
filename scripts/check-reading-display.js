const {
  DEFAULT_READING_PREFERENCES,
  buildReadingDisplayClass,
  formatReadingPreferenceSummary,
  normalizeReadingPreferences,
} = require('../utils/reading-preferences');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

const memory = new Map();
let failWrites = false;
global.wx = {
  getStorageSync(key) {
    return memory.get(key);
  },
  setStorageSync(key, value) {
    if (failWrites) throw new Error('mock storage full');
    memory.set(key, value);
  },
};

const storage = require('../utils/storage');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const defaults = normalizeReadingPreferences();
assert(JSON.stringify(defaults) === JSON.stringify({
  version: 1,
  fontSize: 'standard',
  lineHeight: 'standard',
  imageWidth: 'full',
}), '缺失设置应回退到完整默认值');

const custom = normalizeReadingPreferences({
  version: 1,
  fontSize: 'large',
  lineHeight: 'relaxed',
  imageWidth: 'medium',
  unknown: 'ignored',
});
assert(custom.fontSize === 'large' && custom.lineHeight === 'relaxed' && custom.imageWidth === 'medium', '合法档位应保留');
assert(!Object.prototype.hasOwnProperty.call(custom, 'unknown'), '未知字段不应进入规范结构');

const invalid = normalizeReadingPreferences({
  version: 99,
  fontSize: 'huge',
  lineHeight: null,
  imageWidth: 72,
});
assert(JSON.stringify(invalid) === JSON.stringify(defaults), '非法值应逐字段回退');

const classes = buildReadingDisplayClass(custom);
assert(classes === 'reading-font--large reading-line--relaxed reading-image--medium', '样式类映射错误');
assert(formatReadingPreferenceSummary(custom) === '大字 · 舒展 · 适中图片', '偏好摘要错误');

defaults.fontSize = 'large';
assert(DEFAULT_READING_PREFERENCES.fontSize === 'standard', '调用方不应修改共享默认值');

assert(storage.getReadingPreferences().fontSize === 'standard', '空存储应返回默认阅读设置');
let writeResult = storage.setReadingPreferences({
  version: 1,
  fontSize: 'large',
  lineHeight: 'relaxed',
  imageWidth: 'medium',
});
assert(writeResult.saved && storage.getReadingPreferences().fontSize === 'large', '阅读设置应持久化');

memory.set('knows_reading_preferences', { version: 1, fontSize: 'wrong' });
assert(storage.getReadingPreferences().fontSize === 'standard', '损坏字段应归一化');

failWrites = true;
writeResult = storage.setReadingPreferences({ version: 1, fontSize: 'small' });
failWrites = false;
assert(!writeResult.saved && writeResult.preferences.fontSize === 'small', '保存失败应返回会话偏好和失败状态');

let appConfig;
global.App = (config) => {
  appConfig = config;
};
require('../app');
assert(typeof appConfig.getReadingPreferences === 'function', 'App 缺少阅读设置读取接口');
assert(typeof appConfig.setReadingPreferences === 'function', 'App 缺少阅读设置保存接口');
assert(typeof appConfig.resetReadingPreferences === 'function', 'App 缺少阅读设置重置接口');
assert(appConfig.getReadingPreferences().fontSize === storage.getReadingPreferences().fontSize, 'App 读取接口未委托 storage');

[
  'components/reading-settings/index.js',
  'components/reading-settings/index.json',
  'components/reading-settings/index.wxml',
  'components/reading-settings/index.wxss',
  'styles/reading-display.wxss',
].forEach((file) => {
  assert(fs.existsSync(path.join(root, file)), `缺少阅读设置组件或共享样式 -> ${file}`);
});

const componentWxml = read('components/reading-settings/index.wxml');
const componentWxss = read('components/reading-settings/index.wxss');
const sharedWxss = read('styles/reading-display.wxss');
assert(componentWxml.includes('bindtap="selectOption"'), '设置面板缺少分段选项事件');
assert(componentWxml.includes('bindtap="resetPreferences"'), '设置面板缺少恢复默认入口');
assert(componentWxss.includes('min-height: 88rpx'), '设置控件点击高度不足');
assert(sharedWxss.includes('.reading-image--narrow .reading-image'), '缺少窄图档位');
assert(sharedWxss.includes('width: 72%'), '窄图宽度必须为 72%');
assert(sharedWxss.includes('width: 86%'), '适中图片宽度必须为 86%');
assert(sharedWxss.includes('width: 100%'), '全宽图片必须为 100%');
assert(!sharedWxss.includes('.reading-font--standard'), '标准字号不应覆盖页面现有排版');
assert(!sharedWxss.includes('.reading-line--standard'), '标准行距不应覆盖页面现有排版');

let readingSettingsConfig;
global.Component = (config) => {
  readingSettingsConfig = config;
};
require('../components/reading-settings/index');

const emittedEvents = [];
const settingsInstance = {
  data: {
    preferences: {
      version: 1,
      fontSize: 'large',
      lineHeight: 'relaxed',
      imageWidth: 'medium',
    },
  },
  setData(value) {
    this.data = { ...this.data, ...value };
  },
  triggerEvent(name, detail) {
    emittedEvents.push({ name, detail });
  },
};

readingSettingsConfig.methods.selectOption.call(settingsInstance, {
  currentTarget: { dataset: { field: 'fontSize', value: 'small' } },
});
assert(JSON.stringify(emittedEvents[0]) === JSON.stringify({
  name: 'change',
  detail: {
    preferences: {
      version: 1,
      fontSize: 'small',
      lineHeight: 'relaxed',
      imageWidth: 'medium',
    },
  },
}), '设置面板 change 事件未携带完整归一化偏好');

readingSettingsConfig.methods.resetPreferences.call(settingsInstance);
readingSettingsConfig.methods.close.call(settingsInstance);
assert(emittedEvents[1].name === 'reset' && emittedEvents[2].name === 'close', '设置面板缺少 reset 或 close 事件');

const contentBlockJs = read('components/content-block/index.js');
const contentBlockWxml = read('components/content-block/index.wxml');
const contentBlockWxss = read('components/content-block/index.wxss');
assert(contentBlockJs.includes('readingPreferences'), 'content-block 缺少 readingPreferences 属性');
assert(contentBlockWxml.includes('readingDisplayClass'), 'content-block 根节点未应用阅读显示类');
assert(contentBlockWxss.includes('@import "../../styles/reading-display.wxss"'), 'content-block 未导入共享阅读样式');

[
  'content-block__text',
  'formula-box__formula',
  'formula-box__desc',
  'formula-rule',
  'reasoning-line',
  'steps-box__text',
  'list-box__text',
  'table-box__cell',
  'example-box__sentence',
  'example-box__translation',
  'example-box__row',
  'experiment-box__row',
  'experiment-step',
].forEach((className) => {
  const pattern = new RegExp(`class="[^\"]*${className}[^\"]*reading-copy--\\d+[^\"]*reading-leading--\\d+[^\"]*"`);
  assert(pattern.test(contentBlockWxml), `content-block 缺少 ${className} 的语义排版令牌`);
});

function classAttributeFor(wxml, className) {
  const pattern = new RegExp(`<[^>]+class="([^"]*\\b${className}\\b[^"]*)"[^>]*>`);
  const match = wxml.match(pattern);
  return match ? match[1] : '';
}

['math', 'english', 'physics'].forEach((subject) => {
  const pageRoot = `packages/${subject}/pages/knowledge`;
  const json = JSON.parse(read(`${pageRoot}/index.json`));
  const js = read(`${pageRoot}/index.js`);
  const wxml = read(`${pageRoot}/index.wxml`);
  const wxss = read(`${pageRoot}/index.wxss`);

  assert(json.usingComponents['reading-settings'] === '/components/reading-settings/index', `${subject} 未注册阅读设置组件`);
  assert(wxml.includes('Aa 阅读'), `${subject} 缺少阅读设置入口`);
  assert(classAttributeFor(wxml, 'page-shell').includes('{{readingDisplayClass}}'), `${subject} 页面根节点缺少显示类`);
  assert((wxml.match(/reading-preferences="{{readingPreferences}}"/g) || []).length === 2, `${subject} 未向全部 content-block 传入偏好`);
  assert(wxml.includes('<reading-settings'), `${subject} 缺少设置面板实例`);
  assert(wxml.includes('visible="{{readingSettingsVisible}}"'), `${subject} 设置面板可见状态未受控`);
  assert(wxml.includes('preferences="{{readingPreferences}}"'), `${subject} 设置面板未接收当前偏好`);
  assert(wxml.includes('bindchange="changeReadingPreferences"'), `${subject} 设置面板缺少 change 处理器`);
  assert(wxml.includes('bindreset="resetReadingPreferences"'), `${subject} 设置面板缺少 reset 处理器`);
  assert(wxml.includes('bindclose="closeReadingSettings"'), `${subject} 设置面板缺少 close 处理器`);
  assert(wxss.includes('@import "../../../../styles/reading-display.wxss"'), `${subject} 未导入共享阅读样式`);
  assert((js.match(/this\.syncReadingPreferences\(\);/g) || []).length === 2, `${subject} 未在 onLoad 和 onShow 同步设置`);
  assert(js.includes('readingPreferences: { ...DEFAULT_READING_PREFERENCES }'), `${subject} 缺少独立的默认阅读偏好`);
  assert(js.includes('readingDisplayClass: buildReadingDisplayClass(DEFAULT_READING_PREFERENCES)'), `${subject} 缺少默认显示类`);
  assert(js.includes('readingSettingsVisible: false'), `${subject} 缺少设置面板初始状态`);

  [
    'syncReadingPreferences',
    'openReadingSettings',
    'closeReadingSettings',
    'changeReadingPreferences',
    'resetReadingPreferences',
  ].forEach((methodName) => {
    assert(new RegExp(`${methodName}\\s*\\(`).test(js), `${subject} 缺少 ${methodName} 处理器`);
  });

  assert(classAttributeFor(wxml, 'knowledge-figure__image').includes('reading-image'), `${subject} 知识图缺少图片宽度令牌`);
  assert(classAttributeFor(wxml, 'problem-card__image').includes('reading-image'), `${subject} 例题图缺少图片宽度令牌`);

  [
    'context-path',
    'pill',
    'collect-btn',
    'reading-command',
    'text-command',
    'fold-control__action',
    'note-card__save',
    'problem-card__toggle',
    'page-navigation__item',
  ].forEach((className) => {
    assert(!classAttributeFor(wxml, className).includes('reading-copy'), `${subject} 固定控件 ${className} 不应使用正文字号令牌`);
  });

  [
    'knowledge-hero__summary',
    'core-card__text',
    'knowledge-figure__caption',
    'study-card__text',
    'note-card__input',
    'template-box__when',
    'template-box__text',
    'problem-card__copy',
    'problem-step__text',
  ].forEach((className) => {
    const classAttribute = classAttributeFor(wxml, className);
    assert(classAttribute.includes('reading-copy--') && classAttribute.includes('reading-leading--'), `${subject} 正文 ${className} 缺少语义排版令牌`);
  });
});

const physicsJs = read('packages/physics/pages/knowledge/index.js');
const physicsWxml = read('packages/physics/pages/knowledge/index.wxml');
assert(physicsJs.includes("options.focusType === 'experiment'"), 'physics 丢失实验定向导航');
assert(physicsJs.includes('scrollToPendingFocus()'), 'physics 丢失实验锚点滚动');
assert(physicsWxml.includes('id="{{item.anchorId}}"'), 'physics 丢失实验内容锚点');

const pageConfigs = {};
global.Page = (config) => {
  pageConfigs[global.currentReadingSubject] = config;
};
['math', 'english', 'physics'].forEach((subject) => {
  global.currentReadingSubject = subject;
  require(`../packages/${subject}/pages/knowledge/index`);
});
delete global.currentReadingSubject;

assert(pageConfigs.math.data.readingPreferences !== pageConfigs.english.data.readingPreferences, '页面间不应共享可变阅读偏好对象');
assert(pageConfigs.english.data.readingPreferences !== pageConfigs.physics.data.readingPreferences, '页面间不应共享可变阅读偏好对象');

function createPageInstance(config) {
  return {
    data: {
      ...config.data,
      currentScrollTop: 128,
      detailsExpanded: true,
      templateExpanded: true,
      noteDraft: '保留笔记',
      knowledge: { problems: [{ expanded: true }] },
    },
    updates: [],
    setData(value) {
      this.updates.push(value);
      this.data = { ...this.data, ...value };
    },
  };
}

const toastCalls = [];
wx.showToast = (options) => toastCalls.push(options);
global.getApp = () => ({
  getReadingPreferences() {
    return { version: 1, fontSize: 'large', lineHeight: 'relaxed', imageWidth: 'medium' };
  },
  setReadingPreferences(preferences) {
    return { saved: false, preferences };
  },
  resetReadingPreferences() {
    return { saved: false, preferences: { ...DEFAULT_READING_PREFERENCES } };
  },
});

Object.entries(pageConfigs).forEach(([subject, config]) => {
  const instance = createPageInstance(config);
  const preservedState = {
    currentScrollTop: instance.data.currentScrollTop,
    detailsExpanded: instance.data.detailsExpanded,
    templateExpanded: instance.data.templateExpanded,
    noteDraft: instance.data.noteDraft,
    knowledge: instance.data.knowledge,
  };

  config.openReadingSettings.call(instance);
  assert(JSON.stringify(instance.updates.pop()) === JSON.stringify({ readingSettingsVisible: true }), `${subject} 打开设置面板不应修改阅读状态`);
  config.closeReadingSettings.call(instance);
  assert(JSON.stringify(instance.updates.pop()) === JSON.stringify({ readingSettingsVisible: false }), `${subject} 关闭设置面板不应修改阅读状态`);
  Object.entries(preservedState).forEach(([key, value]) => {
    assert(instance.data[key] === value, `${subject} 设置面板开关修改了 ${key}`);
  });

  const nextPreferences = { version: 1, fontSize: 'small', lineHeight: 'compact', imageWidth: 'narrow' };
  config.changeReadingPreferences.call(instance, { detail: { preferences: nextPreferences } });
  assert(instance.data.readingPreferences === nextPreferences, `${subject} 保存失败时未保留会话偏好`);
  assert(instance.data.readingDisplayClass === 'reading-font--small reading-line--compact reading-image--narrow', `${subject} 未即时应用会话显示类`);
  assert(toastCalls.pop().title === '设置未保存', `${subject} 保存失败提示错误`);

  config.resetReadingPreferences.call(instance);
  assert(instance.data.readingPreferences.fontSize === 'standard', `${subject} 重置失败时未保留默认会话效果`);
  assert(toastCalls.pop().title === '设置未保存', `${subject} 重置失败提示错误`);
});

console.log('OK reading preference normalization, classes and labels checked');
