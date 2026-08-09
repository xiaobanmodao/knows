const fs = require('fs');
const path = require('path');

const VALID_KINDS = new Set(['physical', 'simulator']);
const VALID_PLATFORMS = new Set(['ios', 'android']);
const VALID_STATUSES = new Set(['passed', 'failed', 'pending']);

const REQUIRED_CASE_IDS = [
  'cold-start-home',
  'subject-math',
  'subject-english',
  'subject-physics',
  'subject-chemistry',
  'subject-biology',
  'global-search',
  'legacy-route',
  'package-reentry',
  'favorites-recent-notes',
  'reading-settings',
  'cloud-image-fallback',
  'weak-network-recovery',
  'return-stack',
  'console-clean',
];

const REQUIRED_PHYSICAL_PLATFORMS = ['ios', 'android'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertDate(value, label) {
  assert(isNonEmptyString(value), `${label} 必须为非空字符串`);
  assert(!Number.isNaN(Date.parse(value)), `${label} 不是有效日期`);
}

function validateCase(device, item) {
  assert(item && typeof item === 'object', `${device.id}: 用例记录无效`);
  assert(isNonEmptyString(item.id), `${device.id}: 用例缺少 id`);
  assert(REQUIRED_CASE_IDS.includes(item.id), `${device.id}: 存在未知用例 ${item.id}`);
  assert(VALID_STATUSES.has(item.status), `${device.id}/${item.id}: status 无效`);
  assert(typeof item.note === 'string', `${device.id}/${item.id}: note 必须为字符串`);

  if (item.status === 'failed') {
    assert(isNonEmptyString(item.note), `${device.id}/${item.id}: failed 必须记录原因`);
  }
  if (item.status === 'passed') {
    assert(isNonEmptyString(item.note), `${device.id}/${item.id}: passed 必须记录观察结果`);
  }
}

function validateDevice(device) {
  assert(device && typeof device === 'object', '设备记录无效');
  assert(isNonEmptyString(device.id), '设备记录缺少 id');
  assert(VALID_KINDS.has(device.kind), `${device.id}: kind 无效`);
  assert(VALID_PLATFORMS.has(device.platform), `${device.id}: platform 无效`);
  assert(typeof device.model === 'string', `${device.id}: model 必须为字符串`);
  assert(typeof device.osVersion === 'string', `${device.id}: osVersion 必须为字符串`);
  assert(typeof device.wechatVersion === 'string', `${device.id}: wechatVersion 必须为字符串`);
  assert(typeof device.buildRef === 'string', `${device.id}: buildRef 必须为字符串`);
  assert(VALID_STATUSES.has(device.status), `${device.id}: status 无效`);
  assert(
    device.consoleErrors === null || (Number.isInteger(device.consoleErrors) && device.consoleErrors >= 0),
    `${device.id}: consoleErrors 必须为非负整数或 null`,
  );
  assert(Array.isArray(device.screenshotPaths), `${device.id}: screenshotPaths 必须为数组`);
  device.screenshotPaths.forEach((item) => assert(isNonEmptyString(item), `${device.id}: 截图路径不能为空`));
  assert(Array.isArray(device.cases), `${device.id}: cases 必须为数组`);

  const caseIds = new Set();
  device.cases.forEach((item) => {
    validateCase(device, item);
    assert(!caseIds.has(item.id), `${device.id}: 用例重复 ${item.id}`);
    caseIds.add(item.id);
  });
  assert(
    caseIds.size === REQUIRED_CASE_IDS.length
      && REQUIRED_CASE_IDS.every((id) => caseIds.has(id)),
    `${device.id}: 用例集合不完整`,
  );

  if (device.status === 'passed') {
    assert(isNonEmptyString(device.model), `${device.id}: passed 缺少设备型号`);
    assert(isNonEmptyString(device.osVersion), `${device.id}: passed 缺少系统版本`);
    assert(isNonEmptyString(device.wechatVersion), `${device.id}: passed 缺少微信版本`);
    assert(isNonEmptyString(device.checkedAt), `${device.id}: passed 缺少测试时间`);
    assert(isNonEmptyString(device.buildRef), `${device.id}: passed 缺少构建引用`);
    assert(device.consoleErrors === 0, `${device.id}: passed 必须为 0 个项目控制台错误`);
    assert(device.screenshotPaths.length > 0, `${device.id}: passed 至少需要 1 张截图证据`);
    assert(device.cases.every((item) => item.status === 'passed'), `${device.id}: passed 但仍有未通过用例`);
  }
}

function validateReport(report, { requirePhysical = false } = {}) {
  assert(report && typeof report === 'object', '回归证据必须为对象');
  assert(report.schemaVersion === 1, '回归证据 schemaVersion 必须为 1');
  assert(isNonEmptyString(report.releaseRef), '回归证据缺少 releaseRef');
  assert(isNonEmptyString(report.buildRef), '回归证据缺少 buildRef');
  assertDate(report.checkedAt, '回归证据 checkedAt');
  assert(Array.isArray(report.devices) && report.devices.length > 0, '回归证据至少需要一台设备');

  const deviceIds = new Set();
  report.devices.forEach((device) => {
    validateDevice(device);
    assert(!deviceIds.has(device.id), `设备 id 重复 ${device.id}`);
    deviceIds.add(device.id);
  });

  const physical = report.devices.filter((device) => device.kind === 'physical');
  const physicalPlatforms = new Set(physical.map((device) => device.platform));
  assert(
    REQUIRED_PHYSICAL_PLATFORMS.every((platform) => physicalPlatforms.has(platform)),
    '必须包含 ios 和 android 实体设备记录',
  );

  const pendingPhysical = physical.filter((device) => device.status === 'pending').length;
  const failedPhysical = physical.filter((device) => device.status === 'failed').length;
  if (requirePhysical) {
    assert(pendingPhysical === 0 && failedPhysical === 0, '实体设备回归尚未全部通过');
    assert(physical.every((device) => device.status === 'passed'), '实体设备回归存在未通过设备');
  }

  return {
    pendingPhysical,
    failedPhysical,
    physicalDevices: physical.length,
  };
}

function readReport(filePath) {
  const absolutePath = path.resolve(filePath);
  assert(fs.existsSync(absolutePath), `缺少回归证据文件: ${filePath}`);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(`回归证据 JSON 解析失败: ${error.message}`);
  }
}

function runCli() {
  const args = process.argv.slice(2);
  const requirePhysical = args.includes('--require-device-evidence');
  const fileArg = args.find((arg) => !arg.startsWith('--'))
    || 'docs/release-regression/v1.10.0-evidence.template.json';
  const result = validateReport(readReport(fileArg), { requirePhysical });

  if (requirePhysical) {
    console.log(`OK release regression evidence: ${result.physicalDevices} physical devices passed`);
  } else {
    console.log(
      `OK release regression evidence schema checked · pending physical devices: ${result.pendingPhysical}`,
    );
  }
}

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    console.error(`FOUND_RELEASE_REGRESSION_ISSUES\n${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  REQUIRED_CASE_IDS,
  validateReport,
};
