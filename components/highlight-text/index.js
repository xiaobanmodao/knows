const { buildHighlightSegments } = require('../../utils/search-text');

Component({
  properties: {
    text: {
      type: String,
      value: '',
    },
    terms: {
      type: Array,
      value: [],
    },
  },

  observers: {
    'text, terms': function updateSegments(text, terms) {
      this.setData({
        segments: buildHighlightSegments(text, terms).map((item, index) => ({
          ...item,
          key: `${index}-${item.highlighted ? 'mark' : 'text'}`,
        })),
      });
    },
  },

  data: {
    segments: [],
  },
});
