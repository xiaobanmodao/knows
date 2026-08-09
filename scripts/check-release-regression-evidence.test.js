const assert = require('assert');

const {
  REQUIRED_CASE_IDS,
  validateReport,
} = require('./check-release-regression-evidence');

function makeDevice(overrides = {}) {
  return {
    id: 'iphone-physical',
    kind: 'physical',
    platform: 'ios',
    model: 'iPhone 14 Pro Max',
    osVersion: 'iOS 18',
    wechatVersion: '8.0.0',
    checkedAt: '2026-08-10T10:00:00+08:00',
    buildRef: '880d79b',
    status: 'pending',
    consoleErrors: 0,
    screenshotPaths: [],
    cases: REQUIRED_CASE_IDS.map((id) => ({ id, status: 'pending', note: '' })),
    ...overrides,
  };
}

function makeReport(devices = [makeDevice()]) {
  return {
    schemaVersion: 1,
    releaseRef: 'codex/release-regression-v1.10.1',
    buildRef: '880d79b',
    checkedAt: '2026-08-10T10:00:00+08:00',
    devices,
  };
}

function expectInvalid(report, message, options) {
  assert.throws(() => validateReport(report, options), new RegExp(message));
}

assert.strictEqual(REQUIRED_CASE_IDS.length >= 10, true, '发布回归用例数量过少');

expectInvalid(makeReport(), '必须包含 ios 和 android');

const incompleteDevices = [
  makeDevice(),
  makeDevice({ id: 'android-physical', platform: 'android', model: 'Nexus 5' }),
].map((device) => ({
  ...device,
  cases: device.cases.slice(1),
}));
expectInvalid(makeReport(incompleteDevices), '用例集合不完整');

expectInvalid(
  makeReport([
    makeDevice({
      status: 'passed',
      screenshotPaths: ['.codex-output/release-regression/iphone-home.png'],
      cases: REQUIRED_CASE_IDS.map((id) => ({ id, status: 'passed', note: 'observed' })),
    }),
    makeDevice({ id: 'android-physical', platform: 'android', model: 'Nexus 5' }),
  ]),
  '实体设备回归尚未全部通过',
  { requirePhysical: true },
);

const completeReport = makeReport([
  makeDevice({
    status: 'passed',
    screenshotPaths: ['.codex-output/release-regression/iphone-home.png'],
    cases: REQUIRED_CASE_IDS.map((id) => ({ id, status: 'passed', note: 'observed' })),
  }),
  makeDevice({
    id: 'android-physical',
    platform: 'android',
    model: 'Nexus 5',
    status: 'passed',
    screenshotPaths: ['.codex-output/release-regression/android-home.png'],
    cases: REQUIRED_CASE_IDS.map((id) => ({ id, status: 'passed', note: 'observed' })),
  }),
]);

assert.deepStrictEqual(validateReport(completeReport, { requirePhysical: true }), {
  pendingPhysical: 0,
  failedPhysical: 0,
  physicalDevices: 2,
});

console.log('OK release regression evidence contract tests');
