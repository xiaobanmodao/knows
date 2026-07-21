const { SUBJECT_MANIFEST } = require('../data/subject-manifest');

const PACKAGE_ROUTES = {
  math: {
    subject: '/packages/math/pages/index/index',
    chapter: '/packages/math/pages/chapter/index',
    topic: '/packages/math/pages/topic/index',
    knowledge: '/packages/math/pages/knowledge/index',
    template: '/packages/math/pages/template/index',
  },
  english: {
    subject: '/packages/english/pages/index/index',
    unit: '/packages/english/pages/unit/index',
    word: '/packages/english/pages/unit/index',
    grammar: '/packages/english/pages/unit/index',
    topic: '/packages/english/pages/topic/index',
    knowledge: '/packages/english/pages/knowledge/index',
    template: '/packages/english/pages/template/index',
  },
  physics: {
    subject: '/packages/physics/pages/index/index',
    chapter: '/packages/physics/pages/chapter/index',
    topic: '/packages/physics/pages/topic/index',
    knowledge: '/packages/physics/pages/knowledge/index',
    template: '/packages/physics/pages/template/index',
  },
};

function normalizeSubjectId(subjectId) {
  return PACKAGE_ROUTES[subjectId] ? subjectId : 'math';
}

function appendQuery(route, query) {
  const pairs = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== false)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return pairs.length ? `${route}?${pairs.join('&')}` : route;
}

function buildContentRoute(item = {}) {
  const subjectId = normalizeSubjectId(item.subjectId);
  const type = item.type || 'knowledge';
  const routes = PACKAGE_ROUTES[subjectId];
  const route = routes[type] || routes.knowledge;
  const isEnglishFocus = subjectId === 'english' && ['word', 'grammar'].includes(type);

  return appendQuery(route, {
    id: item.id || item.refId,
    subjectId: type === 'subject' ? '' : subjectId,
    focusType: isEnglishFocus ? type : item.focusType,
    focusId: item.focusId,
    restore: item.restore ? 1 : '',
  });
}

function getSubjectEntryRoute(subjectId) {
  const normalizedId = normalizeSubjectId(subjectId);
  const subject = SUBJECT_MANIFEST.find((item) => item.id === normalizedId);
  return subject ? subject.entryRoute : PACKAGE_ROUTES.math.subject;
}

function openContent(item, options = {}) {
  const method = options.replace ? 'redirectTo' : 'navigateTo';
  const url = buildContentRoute(item);
  const retry = options.retry !== false;

  if (options.loading !== false) {
    wx.showLoading({ title: '正在打开', mask: true });
  }

  wx[method]({
    url,
    success(result) {
      if (typeof options.success === 'function') {
        options.success(result);
      }
    },
    fail(error) {
      if (typeof options.fail === 'function') {
        options.fail(error, url);
        return;
      }

      wx.showModal({
        title: '内容暂未打开',
        content: '请检查网络后重试，已保留当前页面。',
        confirmText: retry ? '重试' : '知道了',
        showCancel: retry,
        success(modalResult) {
          if (retry && modalResult.confirm) {
            openContent(item, { ...options, retry: false });
          }
        },
      });
    },
    complete() {
      if (options.loading !== false) {
        wx.hideLoading();
      }
    },
  });

  return url;
}

module.exports = {
  PACKAGE_ROUTES,
  normalizeSubjectId,
  buildContentRoute,
  getSubjectEntryRoute,
  openContent,
};
