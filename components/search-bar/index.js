Component({
  properties: {
    value: {
      type: String,
      value: '',
    },
    placeholder: {
      type: String,
      value: '搜索知识点、题型模板',
    },
    autoFocus: {
      type: Boolean,
      value: false,
    },
    disabled: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    handleInput(event) {
      this.triggerEvent('change', { value: event.detail.value });
    },

    handleConfirm(event) {
      this.triggerEvent('submit', { value: event.detail.value });
    },

    handleTap() {
      this.triggerEvent('tap');
    },
  },
});
