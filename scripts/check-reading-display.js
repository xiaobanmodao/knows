const {
  DEFAULT_READING_PREFERENCES,
  buildReadingDisplayClass,
  formatReadingPreferenceSummary,
  normalizeReadingPreferences,
} = require('../utils/reading-preferences');

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

console.log('OK reading preference normalization, classes and labels checked');
