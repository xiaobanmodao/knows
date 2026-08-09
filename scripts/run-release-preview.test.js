const assert = require('assert');
const { buildPreviewArgs, validateAppId } = require('./run-release-preview');

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
console.log('OK release preview command contract');
