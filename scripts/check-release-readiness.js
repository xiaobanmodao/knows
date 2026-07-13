const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const issues = [];
const warnings = [];

function readJson(file) {
  const absolutePath = path.join(root, file);

  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    issues.push(`${file}: JSON 解析失败 -> ${error.message}`);
    return null;
  }
}

function fileExists(file) {
  return fs.existsSync(path.join(root, file));
}

function assertFile(file, owner) {
  if (!fileExists(file)) {
    issues.push(`${owner}: 文件不存在 -> ${file}`);
  }
}

function assertDirectory(directory, owner) {
  const absolutePath = path.join(root, directory);

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
    issues.push(`${owner}: 目录不存在 -> ${directory}`);
  }
}

function normalizeComponentPath(componentPath) {
  return componentPath.replace(/^\//, '').replace(/\/index$/, '');
}

function assertComponent(componentName, componentPath, owner) {
  if (!componentPath || /^plugin:\/\//.test(componentPath)) {
    return;
  }

  const basePath = normalizeComponentPath(componentPath);
  const jsonPath = `${basePath}/index.json`;

  ['js', 'json', 'wxml', 'wxss'].forEach((ext) => {
    assertFile(`${basePath}/index.${ext}`, `${owner} 组件 ${componentName}`);
  });

  const componentJson = fileExists(jsonPath) ? readJson(jsonPath) : null;

  if (componentJson && componentJson.component !== true) {
    issues.push(`${owner} 组件 ${componentName}: index.json 缺少 "component": true`);
  }
}

function assertUsingComponents(usingComponents, owner) {
  Object.entries(usingComponents || {}).forEach(([componentName, componentPath]) => {
    assertComponent(componentName, componentPath, owner);
  });
}

function checkPage(pagePath) {
  ['js', 'json', 'wxml', 'wxss'].forEach((ext) => {
    assertFile(`${pagePath}.${ext}`, `页面 ${pagePath}`);
  });

  const pageJson = fileExists(`${pagePath}.json`) ? readJson(`${pagePath}.json`) : null;

  if (pageJson) {
    assertUsingComponents(pageJson.usingComponents, `页面 ${pagePath}`);
  }
}

function checkAppConfig() {
  const appConfig = readJson('app.json');

  if (!appConfig) {
    return null;
  }

  if (!Array.isArray(appConfig.pages) || !appConfig.pages.length) {
    issues.push('app.json: pages 不能为空');
  } else {
    appConfig.pages.forEach(checkPage);
  }

  if (appConfig.cloud !== true) {
    issues.push('app.json: 云开发项目应保持 "cloud": true');
  }

  if (!appConfig.sitemapLocation) {
    issues.push('app.json: 缺少 sitemapLocation');
  } else {
    assertFile(appConfig.sitemapLocation, 'app.json sitemapLocation');
  }

  assertUsingComponents(appConfig.usingComponents, 'app.json');

  const pageSet = new Set(appConfig.pages || []);
  const tabItems = appConfig.tabBar && Array.isArray(appConfig.tabBar.list)
    ? appConfig.tabBar.list
    : [];

  if (!tabItems.length) {
    warnings.push('app.json: tabBar 为空，请确认是否符合发布期望');
  }

  tabItems.forEach((item) => {
    if (!pageSet.has(item.pagePath)) {
      issues.push(`app.json tabBar: pagePath 未注册到 pages -> ${item.pagePath}`);
    }

    if (!item.text) {
      issues.push(`app.json tabBar: 缺少 text -> ${item.pagePath}`);
    }
  });

  return appConfig;
}

function checkProjectConfig() {
  const projectConfig = readJson('project.config.json');

  if (!projectConfig) {
    return;
  }

  if (!/^wx[a-z0-9]{16}$/i.test(projectConfig.appid || '')) {
    issues.push('project.config.json: appid 不是正式小程序 AppID 格式');
  }

  if (projectConfig.compileType !== 'miniprogram') {
    issues.push('project.config.json: compileType 应为 miniprogram');
  }

  if (projectConfig.miniprogramRoot !== './') {
    warnings.push(`project.config.json: miniprogramRoot 当前为 ${projectConfig.miniprogramRoot || '(空)'}`);
  }

  const cloudfunctionRoot = projectConfig.cloudfunctionRoot || 'cloudfunctions/';
  assertDirectory(cloudfunctionRoot, 'project.config.json cloudfunctionRoot');

  const ignoredValues = new Set(((projectConfig.packOptions || {}).ignore || []).map((item) => item.value));

  ['docs', 'scripts', 'cloudfunctions', 'assets/figures/generated'].forEach((item) => {
    if (!ignoredValues.has(item)) {
      warnings.push(`project.config.json packOptions.ignore: 建议忽略 ${item}`);
    }
  });
}

function checkSitemap(appConfig) {
  const sitemapPath = appConfig && appConfig.sitemapLocation ? appConfig.sitemapLocation : 'sitemap.json';
  const sitemap = fileExists(sitemapPath) ? readJson(sitemapPath) : null;

  if (!sitemap) {
    return;
  }

  if (!Array.isArray(sitemap.rules) || !sitemap.rules.length) {
    issues.push(`${sitemapPath}: rules 不能为空`);
    return;
  }

  const pageSet = new Set((appConfig && appConfig.pages) || []);

  sitemap.rules.forEach((rule, index) => {
    if (!['allow', 'disallow'].includes(rule.action)) {
      issues.push(`${sitemapPath}: 第 ${index + 1} 条规则 action 无效 -> ${rule.action}`);
    }

    if (rule.page !== '*' && !pageSet.has(rule.page)) {
      issues.push(`${sitemapPath}: 第 ${index + 1} 条规则 page 未注册 -> ${rule.page}`);
    }
  });
}

function checkCloudFunction() {
  assertFile('cloudfunctions/getImageTempUrls/index.js', '云函数 getImageTempUrls');
  assertFile('cloudfunctions/getImageTempUrls/package.json', '云函数 getImageTempUrls');

  const cloudPackage = fileExists('cloudfunctions/getImageTempUrls/package.json')
    ? readJson('cloudfunctions/getImageTempUrls/package.json')
    : null;

  if (cloudPackage && !(cloudPackage.dependencies || {})['wx-server-sdk']) {
    issues.push('cloudfunctions/getImageTempUrls/package.json: 缺少 wx-server-sdk 依赖');
  }
}

function checkAssetConfig() {
  const assetConfigPath = 'utils/asset-config.js';
  assertFile(assetConfigPath, '云图片配置');

  if (!fileExists(assetConfigPath)) {
    return;
  }

  const content = fs.readFileSync(path.join(root, assetConfigPath), 'utf8');
  const envMatch = content.match(/CLOUD_ENV_ID\s*=\s*['"]([^'"]+)['"]/);
  const baseMatch = content.match(/REMOTE_ASSET_BASE\s*=\s*['"]([^'"]+)['"]/);

  if (!envMatch || !envMatch[1]) {
    issues.push(`${assetConfigPath}: 缺少 CLOUD_ENV_ID`);
  }

  if (!baseMatch || !baseMatch[1].startsWith('cloud://')) {
    issues.push(`${assetConfigPath}: REMOTE_ASSET_BASE 应为 cloud:// 开头的云存储路径`);
  }

  if (envMatch && baseMatch && !baseMatch[1].includes(envMatch[1])) {
    warnings.push(`${assetConfigPath}: REMOTE_ASSET_BASE 与 CLOUD_ENV_ID 看起来不一致`);
  }
}

function checkReleaseInfo() {
  const releaseInfoPath = 'utils/release-info.js';
  assertFile(releaseInfoPath, '发布信息');

  if (!fileExists(releaseInfoPath)) {
    return;
  }

  const { RELEASE_INFO } = require(path.join(root, releaseInfoPath));
  const beianNumber = RELEASE_INFO && RELEASE_INFO.icpBeianNumber;

  if (!beianNumber) {
    issues.push(`${releaseInfoPath}: 备案已通过，icpBeianNumber 不能为空`);
  } else if (!/^[\u4e00-\u9fa5]ICP备\d+号-\d+[A-Z]?$/.test(beianNumber)) {
    warnings.push(`${releaseInfoPath}: 请人工确认备案号格式 -> ${beianNumber}`);
  }

  if (!RELEASE_INFO || RELEASE_INFO.icpBeianUrl !== 'https://beian.miit.gov.cn') {
    issues.push(`${releaseInfoPath}: icpBeianUrl 应指向工信部备案查询页`);
  }
}

const appConfig = checkAppConfig();
checkProjectConfig();
checkSitemap(appConfig);
checkCloudFunction();
checkAssetConfig();
checkReleaseInfo();

if (warnings.length) {
  console.log('WARNINGS');
  warnings.forEach((warning) => console.log(warning));
}

if (issues.length) {
  console.log('FOUND_RELEASE_ISSUES');
  issues.forEach((issue) => console.log(issue));
  process.exit(1);
}

console.log('OK release readiness checked');
