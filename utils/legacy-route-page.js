const { openContent, openRoute } = require('./content-routes');

function createLegacyRoutePage({ resolveItem, resolveUrl, loadingText = '正在打开内容' }) {
  if (typeof resolveItem !== 'function' && typeof resolveUrl !== 'function') {
    throw new Error('Legacy route page requires resolveItem or resolveUrl');
  }

  return {
    data: {
      loadingText,
      failed: false,
      targetUrl: '',
    },

    onLoad(options) {
      this.legacyOptions = options || {};
      this.openTarget();
    },

    openTarget() {
      this.setData({ failed: false, loadingText });
      const navigationOptions = {
        replace: true,
        fail: (error, failedUrl) => {
          this.setData({ failed: true, targetUrl: failedUrl });
        },
      };
      const targetUrl = typeof resolveUrl === 'function'
        ? openRoute(resolveUrl(this.legacyOptions || {}), navigationOptions)
        : openContent(resolveItem(this.legacyOptions || {}), navigationOptions);
      this.setData({ targetUrl });
    },

    retry() {
      this.openTarget();
    },
  };
}

module.exports = { createLegacyRoutePage };
