const {
  DEFAULT_READING_PREFERENCES,
  LABELS,
  normalizeReadingPreferences,
} = require('../../utils/reading-preferences');

const OPTION_GROUPS = [
  { id: 'fontSize', title: '字号', values: ['small', 'standard', 'large'] },
  { id: 'lineHeight', title: '行距', values: ['compact', 'standard', 'relaxed'] },
  { id: 'imageWidth', title: '图片宽度', values: ['narrow', 'medium', 'full'] },
];

function buildGroups(preferences) {
  const value = normalizeReadingPreferences(preferences);
  return OPTION_GROUPS.map((group) => ({
    ...group,
    items: group.values.map((id) => ({
      id,
      label: LABELS[group.id][id],
      selected: value[group.id] === id,
    })),
  }));
}

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    preferences: {
      type: Object,
      value: DEFAULT_READING_PREFERENCES,
      observer(value) {
        this.setData({ groups: buildGroups(value) });
      },
    },
  },

  data: {
    groups: buildGroups(DEFAULT_READING_PREFERENCES),
  },

  methods: {
    selectOption(event) {
      const { field, value } = event.currentTarget.dataset;
      const group = OPTION_GROUPS.find((item) => item.id === field);

      if (!group || !group.values.includes(value)) {
        return;
      }

      const preferences = normalizeReadingPreferences({
        ...normalizeReadingPreferences(this.data.preferences),
        [field]: value,
      });

      this.triggerEvent('change', { preferences });
    },

    resetPreferences() {
      this.triggerEvent('reset');
    },

    close() {
      this.triggerEvent('close');
    },

    stopPropagation() {},
  },
});
