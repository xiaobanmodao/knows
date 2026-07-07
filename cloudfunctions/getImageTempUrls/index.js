const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event) => {
  const fileIDs = Array.isArray(event.fileIDs)
    ? [...new Set(event.fileIDs.filter((item) => typeof item === 'string' && item.startsWith('cloud://')))]
    : [];

  if (!fileIDs.length) {
    return { fileList: [] };
  }

  return cloud.getTempFileURL({
    fileList: fileIDs,
  });
};
