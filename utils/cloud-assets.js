const tempUrlCache = {};

function clearTempFileURLCache() {
  Object.keys(tempUrlCache).forEach((fileID) => {
    delete tempUrlCache[fileID];
  });
}

function isCloudFile(value) {
  return typeof value === 'string' && value.startsWith('cloud://');
}

function chunk(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function isCloudRuntimeReady() {
  if (typeof getApp !== 'function') {
    return true;
  }

  const app = getApp();
  return !app || !app.globalData || app.globalData.cloudReady !== false;
}

function isCloudRuntimeUnavailableError(error) {
  const message = [error && error.errMsg, error && error.message, error && error.errorMessage]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return Boolean(
    /appid\s+missing|appid.*permission|permission\s+denied|not\s+authorized|env.*not\s+found/.test(message)
      || error && String(error.errCode) === '41002',
  );
}

function markCloudRuntimeUnavailable() {
  if (typeof getApp !== 'function') {
    return;
  }

  try {
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.cloudReady = false;
    }
  } catch (error) {
    // App state is optional in isolated tests and legacy pages.
  }
}

function collectTempURLs(fileList) {
  const map = {};
  const failed = [];

  (fileList || []).forEach((item) => {
    if (item.fileID && item.tempFileURL) {
      map[item.fileID] = item.tempFileURL;
      tempUrlCache[item.fileID] = item.tempFileURL;
    } else {
      failed.push({
        fileID: item.fileID,
        status: item.status,
        errMsg: item.errMsg,
      });
    }
  });

  return { map, failed };
}

function warnFailedTempURLs(title, failed) {
  if (!failed.length) {
    return;
  }

  if (failed.some(isCloudRuntimeUnavailableError)) {
    markCloudRuntimeUnavailable();
    return;
  }

  console.warn(title, {
    failedCount: failed.length,
    examples: failed.slice(0, 5),
  });
  console.warn(`${title}明细`, JSON.stringify(failed.slice(0, 5)));
}

function getServerTempFileURLBatch(fileIDs) {
  return new Promise((resolve) => {
    if (!fileIDs.length || !isCloudRuntimeReady() || !wx.cloud || !wx.cloud.callFunction) {
      resolve({});
      return;
    }

    wx.cloud.callFunction({
      name: 'getImageTempUrls',
      data: { fileIDs },
      success(result) {
        const payload = result.result || {};
        const { map, failed } = collectTempURLs(payload.fileList || []);
        warnFailedTempURLs('云函数图片签名失败', failed);
        resolve(map);
      },
      fail(error) {
        if (isCloudRuntimeUnavailableError(error)) {
          markCloudRuntimeUnavailable();
          resolve({});
          return;
        }
        console.warn('云函数图片签名调用失败，请确认 getImageTempUrls 已部署', {
          count: fileIDs.length,
          errMsg: error && error.errMsg,
        });
        resolve({});
      },
    });
  });
}

function getClientTempFileURLBatch(fileIDs) {
  return new Promise((resolve) => {
    if (!fileIDs.length || !isCloudRuntimeReady() || !wx.cloud || !wx.cloud.getTempFileURL) {
      resolve({});
      return;
    }

    wx.cloud.getTempFileURL({
      fileList: fileIDs,
      success(result) {
        const { map, failed } = collectTempURLs(result.fileList || []);
        warnFailedTempURLs('小程序端云存储图片签名失败', failed);
        resolve(map);
      },
      fail(error) {
        if (isCloudRuntimeUnavailableError(error)) {
          markCloudRuntimeUnavailable();
          resolve({});
          return;
        }
        console.warn('小程序端云存储临时链接获取失败', {
          count: fileIDs.length,
          errMsg: error && error.errMsg,
        });
        resolve({});
      },
    });
  });
}

function getTempFileURLBatch(fileIDs) {
  return getServerTempFileURLBatch(fileIDs).then((serverMap) => {
    if (!isCloudRuntimeReady()) {
      return serverMap;
    }

    const missing = fileIDs.filter((fileID) => !serverMap[fileID]);

    if (!missing.length) {
      return serverMap;
    }

    return getClientTempFileURLBatch(missing).then((clientMap) => ({
      ...serverMap,
      ...clientMap,
    }));
  });
}

function getTempFileURLMap(fileIDs) {
  const uniqueFileIDs = [...new Set(fileIDs.filter(isCloudFile))];
  const map = {};
  const missing = [];

  uniqueFileIDs.forEach((fileID) => {
    if (tempUrlCache[fileID]) {
      map[fileID] = tempUrlCache[fileID];
    } else {
      missing.push(fileID);
    }
  });

  if (!missing.length) {
    return Promise.resolve(map);
  }

  return Promise.all(chunk(missing, 50).map(getTempFileURLBatch))
    .then((results) => results.reduce((next, item) => Object.assign(next, item), map))
    .catch((error) => {
      if (isCloudRuntimeUnavailableError(error)) {
        markCloudRuntimeUnavailable();
        return map;
      }
      console.warn('云图片临时链接获取异常，已回退为文字内容', {
        count: missing.length,
        errMsg: error && error.errMsg,
      });
      return map;
    });
}

function applyTempFileURL(value, fileMap) {
  if (!value) {
    return '';
  }

  if (!isCloudFile(value)) {
    return value;
  }

  return fileMap[value] || '';
}

module.exports = {
  applyTempFileURL,
  clearTempFileURLCache,
  getTempFileURLMap,
  isCloudFile,
};
