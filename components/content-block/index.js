const {
  DEFAULT_READING_PREFERENCES,
  buildReadingDisplayClass,
} = require('../../utils/reading-preferences');

Component({
  properties: {
    section: {
      type: Object,
      value: {},
    },
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
        if (section.scenario) {
          content = [
            section.title,
            `情境：${section.scenario}`,
            ...(section.steps || []).map((item, index) => `${index + 1}. ${item}`),
            `结论：${section.conclusion || ''}`,
          ].filter(Boolean).join('\n');
        } else {
          content = [section.sentence, section.translation, section.focus, section.note].filter(Boolean).join('\n');
        }
      } else if (section.type === 'experiment') {
        if (section.purpose) {
          content = [
            section.title,
            `目的：${section.purpose || ''}`,
            `器材：${(section.apparatus || []).join('、')}`,
            ...(section.steps || []).map((item, index) => `${index + 1}. ${item}`),
            `现象：${section.phenomenon || ''}`,
            `结论：${section.conclusion || ''}`,
            `误差：${(section.errors || []).join('；')}`,
            `安全：${section.safety || ''}`,
          ].filter(Boolean).join('\n');
        } else {
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
      } else if (section.type === 'equation') {
        content = [
          section.title,
          `方程式：${section.equation || ''}`,
          `条件：${section.condition || ''}`,
          `现象：${section.phenomenon || ''}`,
          `解释：${section.interpretation || ''}`,
          `比例：${section.ratioNote || ''}`,
        ].filter(Boolean).join('\n');
      } else if (section.type === 'safety') {
        content = [
          section.title,
          ...(section.risks || []).map((item) => `风险：${item}`),
          ...(section.rules || []).map((item, index) => `规则 ${index + 1}：${item}`),
          `应急：${section.emergencyNote || ''}`,
        ].filter(Boolean).join('\n');
      } else if (section.type === 'comparison') {
        content = [
          section.title,
          (section.columns || []).join(' | '),
          ...(section.rows || []).map((row) => row.join(' | ')),
        ].filter(Boolean).join('\n');
      } else if (section.type === 'reasoning') {
        content = [
          section.title,
          '成立条件',
          ...(section.conditions || []).map((item, index) => `${index + 1}. ${item}`),
          ...(section.derivations || []).flatMap((item) => [
            item.title,
            ...(item.steps || []).map((step, index) => `${index + 1}. ${step}`),
            `得到：${item.conclusion || ''}`,
          ]),
          '为什么成立',
          ...(section.whyItWorks || []),
          '跨学科联系',
          ...(section.connections || []).map((item) => `${item.title}：${item.description}`),
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
