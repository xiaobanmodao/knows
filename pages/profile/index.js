const { RELEASE_INFO } = require('../../utils/release-info');
const { getSubjectRegistry, SUBJECT_LABELS } = require('../../data/subject-manifest');
const { openContent } = require('../../utils/content-routes');
const { REFERENCE_INDEX_META } = require('../../data/reference-index');

const subjects = getSubjectRegistry();
const referenceTotal = Object.values(REFERENCE_INDEX_META.counts).reduce((total, count) => total + count, 0);

Page({
  data: {
    mode: '游客模式',
    releaseInfo: RELEASE_INFO,
    hasIcpBeian: Boolean(RELEASE_INFO.icpBeianNumber),
    notes: [],
    referenceItems: [
      { id: 'formula', title: '公式索引', count: REFERENCE_INDEX_META.counts.formula, description: '数学与物理公式、条件和单位' },
      { id: 'word', title: '单词索引', count: REFERENCE_INDEX_META.counts.word, description: '英美音标、词义、搭配和辨析' },
      { id: 'grammar', title: '语法索引', count: REFERENCE_INDEX_META.counts.grammar, description: '结构变式、条件和易混对比' },
      { id: 'experiment', title: '实验索引', count: REFERENCE_INDEX_META.counts.experiment, description: '方法、步骤、结论和误差' },
    ],
    referenceTotal,
    serviceItems: [
      '内容结构：学科大包 / 教材单元或专题 / 知识点与方法',
      '能力范围：搜索、收藏、继续阅读、本地笔记与图示展示',
      '使用方式：无需注册登录，学习记录保存在本机',
    ],
    versionItems: [
      `数学：${subjects[0].chapterCount} 章 · ${subjects[0].topicCount} 专题 · ${subjects[0].templateCount} 模板`,
      `英语：${subjects[1].unitCount} 教材单元 · ${subjects[1].vocabularyCount} 逐词讲解 · ${subjects[1].grammarCount} 语法点`,
      `物理：${subjects[2].chapterCount} 教材章 · ${subjects[2].knowledgeCount} 知识点 · ${subjects[2].exampleCount} 示例`,
      '已支持：三科目录、知识阅读、方法模板、搜索、收藏、继续阅读与本地笔记',
    ],
  },

  onShow() {
    const notes = getApp().getNotes().map((note) => ({
      ...note,
      tags: note.tags || [],
      subjectLabel: SUBJECT_LABELS[note.subjectId || 'math'] || '数学',
    }));
    this.setData({ notes });
  },

  openNote(event) {
    const { id, subjectId } = event.currentTarget.dataset;
    openContent({ subjectId: subjectId || 'math', type: 'knowledge', id, restore: true });
  },

  openReference(event) {
    wx.navigateTo({ url: `/pages/reference-index/index?kind=${event.currentTarget.dataset.kind}` });
  },

  copyBeianUrl() {
    wx.setClipboardData({
      data: RELEASE_INFO.icpBeianUrl,
      success() {
        wx.showToast({
          title: '备案查询地址已复制',
          icon: 'none',
        });
      },
    });
  },
});
