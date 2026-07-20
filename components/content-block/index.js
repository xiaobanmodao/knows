Component({
  properties: {
    section: {
      type: Object,
      value: {},
    },
  },

  methods: {
    copySection() {
      const section = this.data.section || {};
      let content = '';

      if (section.type === 'formula') {
        content = [section.title, section.formula, section.description].filter(Boolean).join('\n');
      } else if (section.type === 'example') {
        content = [section.sentence, section.translation, section.focus, section.note].filter(Boolean).join('\n');
      } else if (section.type === 'experiment') {
        content = [
          section.title,
          `目的：${section.goal || ''}`,
          `器材：${section.apparatusText || ''}`,
          ...(section.steps || []).map((item, index) => `${index + 1}. ${item}`),
          `现象：${section.phenomenon || ''}`,
          `结论：${section.conclusion || ''}`,
          `误差：${section.errorsText || ''}`,
          `安全：${section.safety || ''}`,
        ].join('\n');
      }

      if (!content) {
        return;
      }

      wx.setClipboardData({
        data: content,
        success() {
          wx.showToast({ title: '内容已复制', icon: 'none' });
        },
      });
    },
  },
});
