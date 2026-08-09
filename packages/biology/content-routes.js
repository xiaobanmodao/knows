const BIOLOGY_ROUTES = Object.freeze({
  subject: '/packages/biology/pages/index/index',
  topic: '/packages/biology/pages/topic/index',
  knowledge: '/packages/biology/pages/knowledge/index',
  template: '/packages/biology/pages/template/index',
});

function appendQuery(route, query) {
  const pairs = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== false)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return pairs.length ? `${route}?${pairs.join('&')}` : route;
}

function buildBiologyContentRoute(item = {}) {
  const type = BIOLOGY_ROUTES[item.type] ? item.type : 'knowledge';
  return appendQuery(BIOLOGY_ROUTES[type], {
    id: item.id || item.refId,
    focusType: item.focusType,
    focusId: item.focusId,
    restore: item.restore ? 1 : '',
  });
}

function openBiologyContent(item, options = {}) {
  const method = options.replace ? 'redirectTo' : 'navigateTo';
  const url = buildBiologyContentRoute(item);
  const retry = options.retry !== false;
  if (options.loading !== false) wx.showLoading({ title: '正在打开', mask: true });
  wx[method]({
    url,
    success(result) {
      if (typeof options.success === 'function') options.success(result);
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
          if (retry && modalResult.confirm) openBiologyContent(item, { ...options, retry: false });
        },
      });
    },
    complete() {
      if (options.loading !== false) wx.hideLoading();
    },
  });
  return url;
}

module.exports = { BIOLOGY_ROUTES, buildBiologyContentRoute, openBiologyContent };
