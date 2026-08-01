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
        content = [
          section.title,
          section.formula,
          section.description,
          section.quantities && section.quantities.length
            ? `物理量与单位：${section.quantities.map((item) => `${item.name} ${item.symbol}（${item.unit}）`).join('；')}`
            : '',
          ...(section.conditions || []).map((item) => `适用条件：${item}`),
          ...(section.directionRules || []).map((item) => `方向规则：${item}`),
        ].filter(Boolean).join('\n');
      } else if (section.type === 'example') {
        content = [section.sentence, section.translation, section.focus, section.note].filter(Boolean).join('\n');
      } else if (section.type === 'experiment') {
        content = [
          section.title,
          section.method ? `方法：${section.method}` : '',
          `目的：${section.goal || ''}`,
          `器材：${section.apparatusText || ''}`,
          section.controlsText ? `控制：${section.controlsText}` : '',
          ...(section.steps || []).map((item, index) => `${index + 1}. ${item}`),
          section.recordsText ? `记录：${section.recordsText}` : '',
          `现象：${section.phenomenon || ''}`,
          `结论：${section.conclusion || ''}`,
          `误差：${section.errorsText || ''}`,
          `安全：${section.safety || ''}`,
        ].filter(Boolean).join('\n');
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
