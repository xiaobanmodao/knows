const DEFAULT_READING_PREFERENCES = Object.freeze({
  version: 1,
  fontSize: 'standard',
  lineHeight: 'standard',
  imageWidth: 'full',
});

const FONT_SIZES = new Set(['small', 'standard', 'large']);
const LINE_HEIGHTS = new Set(['compact', 'standard', 'relaxed']);
const IMAGE_WIDTHS = new Set(['narrow', 'medium', 'full']);
const LABELS = {
  fontSize: { small: '小字', standard: '标准字', large: '大字' },
  lineHeight: { compact: '紧凑', standard: '标准', relaxed: '舒展' },
  imageWidth: { narrow: '窄图', medium: '适中图片', full: '全宽图片' },
};

function normalizeReadingPreferences(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    version: 1,
    fontSize: source.version === 1 && FONT_SIZES.has(source.fontSize) ? source.fontSize : 'standard',
    lineHeight: source.version === 1 && LINE_HEIGHTS.has(source.lineHeight) ? source.lineHeight : 'standard',
    imageWidth: source.version === 1 && IMAGE_WIDTHS.has(source.imageWidth) ? source.imageWidth : 'full',
  };
}

function buildReadingDisplayClass(value) {
  const preferences = normalizeReadingPreferences(value);
  return `reading-font--${preferences.fontSize} reading-line--${preferences.lineHeight} reading-image--${preferences.imageWidth}`;
}

function formatReadingPreferenceSummary(value) {
  const preferences = normalizeReadingPreferences(value);
  return [
    LABELS.fontSize[preferences.fontSize],
    LABELS.lineHeight[preferences.lineHeight],
    LABELS.imageWidth[preferences.imageWidth],
  ].join(' · ');
}

module.exports = {
  DEFAULT_READING_PREFERENCES,
  FONT_SIZES,
  LINE_HEIGHTS,
  IMAGE_WIDTHS,
  LABELS,
  normalizeReadingPreferences,
  buildReadingDisplayClass,
  formatReadingPreferenceSummary,
};
