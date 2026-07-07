const { RELEASE_INFO } = require('../../utils/release-info');

Page({
  data: {
    mode: '游客模式',
    releaseInfo: RELEASE_INFO,
    hasIcpBeian: Boolean(RELEASE_INFO.icpBeianNumber),
    serviceItems: [
      '内容结构：年级 / 册别 / 章节 / 知识点 / 模板题',
      '能力范围：搜索、收藏、最近浏览、图示展示',
      '使用方式：无需注册登录，学习记录保存在本机',
    ],
    versionItems: [
      '已开放：初中数学 7 上至 9 下章节目录',
      '已支持：知识点阅读、模板题查看、收藏与搜索',
      '规划中：英语、物理、错题本与学习记录',
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
