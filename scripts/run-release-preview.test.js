const assert = require('assert');
const {
  buildPreviewArgs,
  validateAppId,
  extractPreviewErrorCode,
  buildPreviewStatus,
} = require('./run-release-preview');

assert.strictEqual(validateAppId('wxb10a8a067e2709e9'), 'wxb10a8a067e2709e9');
assert.throws(() => validateAppId('touristappid'), /正式小程序 AppID/);

const preview = buildPreviewArgs({
  projectRoot: '/tmp/knows',
  appid: 'wxb10a8a067e2709e9',
  outputDir: '/tmp/knows-output',
});
assert.deepStrictEqual(preview.args, [
  'preview',
  '--project', '/tmp/knows',
  '--appid', 'wxb10a8a067e2709e9',
  '--qr-format', 'image',
  '--qr-output', '/tmp/knows-output/preview-qr.png',
  '--info-output', '/tmp/knows-output/packages-preview.json',
]);
assert.strictEqual(preview.reportPath, '/tmp/knows-output/packages-preview.json');
assert.strictEqual(extractPreviewErrorCode('上传失败，错误码：41002,appid missing'), '41002');
assert.strictEqual(extractPreviewErrorCode('preview completed'), null);
assert.deepStrictEqual(
  buildPreviewStatus({
    status: 'blocked',
    stage: 'upload',
    appid: 'wxb10a8a067e2709e9',
    startedAt: '2026-08-10T00:00:00.000Z',
    finishedAt: '2026-08-10T00:01:00.000Z',
    exitCode: 1,
    errorCode: '41002',
    message: 'appid missing',
    paths: {
      logPath: '/project/.codex-output/preview.log',
      reportPath: '/project/.codex-output/packages-preview.json',
      qrPath: '/project/.codex-output/preview-qr.png',
    },
  }),
  {
    schemaVersion: 1,
    status: 'blocked',
    stage: 'upload',
    appid: 'wxb10a8a067e2709e9',
    startedAt: '2026-08-10T00:00:00.000Z',
    finishedAt: '2026-08-10T00:01:00.000Z',
    exitCode: 1,
    errorCode: '41002',
    message: 'appid missing',
    paths: {
      logPath: '/project/.codex-output/preview.log',
      reportPath: '/project/.codex-output/packages-preview.json',
      qrPath: '/project/.codex-output/preview-qr.png',
    },
  },
);
console.log('OK release preview command contract');
