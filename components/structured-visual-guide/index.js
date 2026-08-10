const {
  DEFAULT_READING_PREFERENCES,
  buildReadingDisplayClass,
} = require('../../utils/reading-preferences');

Component({
  properties: {
    guide: { type: Object, value: null },
    readingPreferences: {
      type: Object,
      value: DEFAULT_READING_PREFERENCES,
      observer(value) {
        this.setData({ readingDisplayClass: buildReadingDisplayClass(value) });
      },
    },
  },
  data: {
    readingDisplayClass: buildReadingDisplayClass(DEFAULT_READING_PREFERENCES),
  },
});
