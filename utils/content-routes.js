const {
  getSubjectMeta,
  getSubjectRegistry,
  getSubjectRoutes,
} = require('../data/subject-manifest');

const PACKAGE_ROUTES = getSubjectRegistry().reduce((routes, subject) => ({
  ...routes,
  [subject.id]: getSubjectRoutes(subject.id),
}), {});

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
  const subject = getSubjectMeta(normalizedId);
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
