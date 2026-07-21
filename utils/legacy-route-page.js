const { openContent } = require('./content-routes');

function createLegacyRoutePage({ resolveItem, loadingText = '正在打开内容' }) {
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
      const item = resolveItem(this.legacyOptions || {});
      this.setData({ failed: false, loadingText });
      const targetUrl = openContent(item, {
        replace: true,
        fail: (error, failedUrl) => {
          this.setData({ failed: true, targetUrl: failedUrl });
        },
      });
      this.setData({ targetUrl });
    },

    retry() {
      this.openTarget();
    },
  };
}

module.exports = { createLegacyRoutePage };
