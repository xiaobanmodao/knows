const BACKUP_FILE_BASENAME = 'knows-local-backup.json';

function getBackupFilePath() {
  return `${wx.env.USER_DATA_PATH}/${BACKUP_FILE_BASENAME}`;
}

function pad(number) {
  return number < 10 ? `0${number}` : String(number);
}

function buildBackupFileName(timestamp = Date.now()) {
  const date = new Date(timestamp);
  return `knows-backup-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
}

function writeBackupFile(text) {
  const filePath = getBackupFilePath();
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().writeFile({
      filePath,
      data: text,
      encoding: 'utf8',
      success: () => resolve(filePath),
      fail: reject,
    });
  });
}

function shareBackupFile(filePath, fileName) {
  return new Promise((resolve, reject) => {
    if (typeof wx.shareFileMessage !== 'function') {
      reject(new Error('当前微信版本不支持发送备份文件'));
      return;
    }
    wx.shareFileMessage({ filePath, fileName, success: resolve, fail: reject });
  });
}

function chooseBackupFile() {
  return new Promise((resolve, reject) => {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success(result) {
        const file = Array.isArray(result.tempFiles) ? result.tempFiles[0] : null;
        if (!file || !file.path) {
          reject(new Error('没有读取到备份文件'));
          return;
        }
        resolve(file);
      },
      fail: reject,
    });
  });
}

function readBackupFile(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'utf8',
      success: (result) => resolve(result.data),
      fail: reject,
    });
  });
}

function isUserCancel(error) {
  return /cancel/i.test(String(error && (error.errMsg || error.message || error)));
}

module.exports = {
  BACKUP_FILE_BASENAME,
  buildBackupFileName,
  chooseBackupFile,
  isUserCancel,
  readBackupFile,
  shareBackupFile,
  writeBackupFile,
};
