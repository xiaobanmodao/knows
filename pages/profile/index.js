const { RELEASE_INFO } = require('../../utils/release-info');
const { getSubjectRegistry } = require('../../utils/subjects');

const subjects = getSubjectRegistry();

Page({
  data: {
    mode: '游客模式',
    releaseInfo: RELEASE_INFO,
    hasIcpBeian: Boolean(RELEASE_INFO.icpBeianNumber),
    serviceItems: [
      '内容结构：学科大包 / 教材单元或专题 / 知识点与方法',
      '能力范围：搜索、收藏、最近浏览、图示展示',
      '使用方式：无需注册登录，学习记录保存在本机',
    ],
    versionItems: [
      `数学：${subjects[0].chapterCount} 章 · ${subjects[0].topicCount} 专题 · ${subjects[0].templateCount} 模板`,
      `英语：${subjects[1].unitCount} 教材单元 · ${subjects[1].vocabularyCount} 逐词讲解 · ${subjects[1].grammarCount} 语法点`,
      `物理：${subjects[2].chapterCount} 教材章 · ${subjects[2].knowledgeCount} 知识点 · ${subjects[2].exampleCount} 示例`,
      '已支持：英语按单元学习、三科搜索、知识阅读、方法模板、收藏与最近浏览',
    ],
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
