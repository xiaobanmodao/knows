Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },

  methods: {
    handleTap() {
      this.triggerEvent('select', this.properties.item);
    },
  },
});
