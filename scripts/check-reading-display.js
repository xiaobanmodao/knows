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

console.log('OK reading preference normalization, classes and labels checked');
