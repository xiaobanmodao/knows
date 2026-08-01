const {
  DEFAULT_READING_PREFERENCES,
  buildReadingDisplayClass,
  formatReadingPreferenceSummary,
  normalizeReadingPreferences,
} = require('../utils/reading-preferences');

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

console.log('OK reading preference normalization, classes and labels checked');
