const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getPackageRegistry } = require('../data/package-manifest');
const {
  describePreviewStatus,
  getPreviewStatusPath,
  readPreviewStatus,
} = require('./check-release-package-evidence');
const { shouldRequireHotfixScope } = require('./check-release-hotfix-scope');

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

  const packageRoots = new Set();
  const configuredPackages = appConfig.subPackages || [];
  configuredPackages.forEach((packageConfig) => {
    if (!packageConfig.root || packageRoots.has(packageConfig.root)) {
      issues.push(`app.json subPackages: root 缺失或重复 -> ${packageConfig.root || '(空)'}`);
      return;
    }

    packageRoots.add(packageConfig.root);
    if (!Array.isArray(packageConfig.pages) || !packageConfig.pages.length) {
      issues.push(`app.json subPackages: ${packageConfig.root} pages 不能为空`);
      return;
    }

    packageConfig.pages.forEach((pagePath) => checkPage(`${packageConfig.root}/${pagePath}`));
  });

  const expectedPackages = getPackageRegistry();
  expectedPackages.forEach((expected) => {
    const matches = configuredPackages.filter((item) => (
      item.name === expected.id && item.root === expected.root
    ));
    if (matches.length !== 1 || JSON.stringify(matches[0].pages) !== JSON.stringify(expected.pages)) {
      issues.push(`app.json subPackages: ${expected.id} 与包注册表不一致`);
    }
  });
  if (configuredPackages.length !== expectedPackages.length) {
    issues.push(`app.json subPackages: 配置 ${configuredPackages.length} 个，注册表要求 ${expectedPackages.length} 个`);
  }

  if (appConfig.preloadRule) {
    issues.push('app.json: 不应配置 preloadRule，应保持按需加载');
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

  const pageSet = new Set([
    ...(appConfig.pages || []),
    ...(appConfig.subPackages || []).flatMap((packageConfig) => (
      (packageConfig.pages || []).map((pagePath) => `${packageConfig.root}/${pagePath}`)
    )),
  ]);
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

  const pageSet = new Set([
    ...((appConfig && appConfig.pages) || []),
    ...((appConfig && appConfig.subPackages) || []).flatMap((packageConfig) => (
      (packageConfig.pages || []).map((pagePath) => `${packageConfig.root}/${pagePath}`)
    )),
  ]);

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
  assertFile('scripts/check-cloud-assets-runtime.js', '云图片运行时校验');

  const cloudPackage = fileExists('cloudfunctions/getImageTempUrls/package.json')
    ? readJson('cloudfunctions/getImageTempUrls/package.json')
    : null;

  if (cloudPackage && !(cloudPackage.dependencies || {})['wx-server-sdk']) {
    issues.push('cloudfunctions/getImageTempUrls/package.json: 缺少 wx-server-sdk 依赖');
  }
}

function checkCloudPrivacyTooling() {
  const scripts = [
    'scripts/check-cloud-user-trace.test.js',
    'scripts/check-cloud-user-trace.js',
  ];
  scripts.forEach((script) => assertFile(script, '云开发用户追踪隐私门禁'));
  if (!scripts.every(fileExists)) return;

  scripts.forEach((script) => {
    try {
      execFileSync(process.execPath, [path.join(root, script)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message)
        .trim()
        .split('\n')
        .slice(-3)
        .join(' | ');
      issues.push(`云开发用户追踪隐私门禁 ${script}: 执行失败 -> ${output}`);
    }
  });
}

function checkReleaseHotfixScopeTooling() {
  if (!shouldRequireHotfixScope(process.argv.slice(2))) {
    return;
  }

  const scripts = [
    'scripts/check-release-hotfix-scope.test.js',
    'scripts/check-release-hotfix-scope.js',
  ];
  scripts.forEach((script) => assertFile(script, '发布热修复范围门禁'));
  if (!scripts.every(fileExists)) return;

  scripts.forEach((script) => {
    try {
      execFileSync(process.execPath, [path.join(root, script)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message)
        .trim()
        .split('\n')
        .slice(-3)
        .join(' | ');
      issues.push(`发布热修复范围门禁 ${script}: 执行失败 -> ${output}`);
    }
  });
}

function checkContentAuditTooling() {
  const auditScripts = ['scripts/content-audit.js', 'scripts/build-content-audit.js', 'scripts/check-content-audit.js'];
  auditScripts.forEach((file) => assertFile(file, '内容审计工具'));

  const auditOutput = path.resolve(root, 'dist/content-audit/content-audit.json');
  if (!auditOutput.startsWith(path.resolve(root, 'dist/content-audit') + path.sep)) {
    issues.push('内容审计工具: 输出路径必须位于 dist/content-audit/');
  }

  if (auditScripts.every(fileExists)) {
    ['scripts/build-content-audit.js', 'scripts/check-content-audit.js'].forEach((script) => {
      try {
        execFileSync(process.execPath, [path.join(root, script)], {
          cwd: root,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (error) {
        const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
        issues.push(`内容审计工具 ${script}: 执行失败 -> ${output}`);
      }
    });
  }
}

function checkContentReviewQueueTooling() {
  const queueScripts = [
    'scripts/content-review-queue.js',
    'scripts/build-content-review-queue.js',
    'scripts/check-content-review-queue.js',
  ];
  queueScripts.forEach((file) => assertFile(file, '内容复核队列工具'));

  const queueOutput = path.resolve(root, 'dist/content-audit/content-review-queue.json');
  if (!queueOutput.startsWith(path.resolve(root, 'dist/content-audit') + path.sep)) {
    issues.push('内容复核队列工具: 输出路径必须位于 dist/content-audit/');
  }

  if (queueScripts.every(fileExists)) {
    ['scripts/build-content-review-queue.js', 'scripts/check-content-review-queue.js'].forEach((script) => {
      try {
        execFileSync(process.execPath, [path.join(root, script)], {
          cwd: root,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (error) {
        const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
        issues.push(`内容复核队列工具 ${script}: 执行失败 -> ${output}`);
      }
    });
  }
}

function checkPureKnowledgeRuntimeTooling() {
  const runtimeScripts = [
    'scripts/check-pure-knowledge-runtime.test.js',
    'scripts/check-pure-knowledge-runtime.js',
  ];
  runtimeScripts.forEach((file) => assertFile(file, '纯知识运行层文案工具'));

  if (runtimeScripts.every(fileExists)) {
    runtimeScripts.forEach((script) => {
      try {
        execFileSync(process.execPath, [path.join(root, script)], {
          cwd: root,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (error) {
        const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
        issues.push(`纯知识运行层文案工具 ${script}: 执行失败 -> ${output}`);
      }
    });
  }
}

function checkMathCurriculumAuditTooling() {
  const auditScripts = [
    'packages/math/data/math-curriculum-baseline.js',
    'scripts/math-curriculum-audit.js',
    'scripts/build-math-curriculum-audit.js',
    'scripts/check-math-curriculum-audit.js',
  ];
  auditScripts.forEach((file) => assertFile(file, '数学新版目录审计工具'));

  const auditOutput = path.resolve(root, 'dist/content-audit/math-curriculum-diff.json');
  if (!auditOutput.startsWith(path.resolve(root, 'dist/content-audit') + path.sep)) {
    issues.push('数学新版目录审计工具: 输出路径必须位于 dist/content-audit/');
  }

  if (auditScripts.slice(1).every(fileExists)) {
    ['scripts/build-math-curriculum-audit.js', 'scripts/check-math-curriculum-audit.js'].forEach((script) => {
      try {
        execFileSync(process.execPath, [path.join(root, script)], {
          cwd: root,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (error) {
        const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
        issues.push(`数学新版目录审计工具 ${script}: 执行失败 -> ${output}`);
      }
    });
  }
}

function checkMathContainerReviewTooling() {
  const reviewScript = 'scripts/check-math-container-review.js';
  assertFile(reviewScript, '数学章节容器复核工具');

  if (fileExists(reviewScript)) {
    try {
      execFileSync(process.execPath, [path.join(root, reviewScript)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
      issues.push(`数学章节容器复核工具: 执行失败 -> ${output}`);
    }
  }
}

function checkMathTopicReviewTooling() {
  const reviewScript = 'scripts/check-math-topic-review.js';
  assertFile(reviewScript, '数学专题复核工具');

  if (fileExists(reviewScript)) {
    try {
      execFileSync(process.execPath, [path.join(root, reviewScript)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
      issues.push(`数学专题复核工具: 执行失败 -> ${output}`);
    }
  }
}

function checkMathTemplateReviewTooling() {
  const reviewScript = 'scripts/check-math-template-review.js';
  assertFile(reviewScript, '数学方法模板复核工具');

  if (fileExists(reviewScript)) {
    try {
      execFileSync(process.execPath, [path.join(root, reviewScript)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
      issues.push(`数学方法模板复核工具: 执行失败 -> ${output}`);
    }
  }
}

function checkEnglishTopicReviewTooling() {
  const reviewScript = 'scripts/check-english-topic-review.js';
  assertFile(reviewScript, '英语专题复核工具');

  if (fileExists(reviewScript)) {
    try {
      execFileSync(process.execPath, [path.join(root, reviewScript)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
      issues.push(`英语专题复核工具: 执行失败 -> ${output}`);
    }
  }
}

function checkPhysicsTopicReviewTooling() {
  const reviewScript = 'scripts/check-physics-topic-review.js';
  assertFile(reviewScript, '物理专题复核工具');

  if (fileExists(reviewScript)) {
    try {
      execFileSync(process.execPath, [path.join(root, reviewScript)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
      issues.push(`物理专题复核工具: 执行失败 -> ${output}`);
    }
  }
}

function checkEnglishTemplateReviewTooling() {
  const reviewScript = 'scripts/check-english-template-review.js';
  assertFile(reviewScript, '英语方法模板复核工具');

  if (fileExists(reviewScript)) {
    try {
      execFileSync(process.execPath, [path.join(root, reviewScript)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
      issues.push(`英语方法模板复核工具: 执行失败 -> ${output}`);
    }
  }
}

function checkPhysicsTemplateReviewTooling() {
  const reviewScript = 'scripts/check-physics-template-review.js';
  assertFile(reviewScript, '物理方法模板复核工具');

  if (fileExists(reviewScript)) {
    try {
      execFileSync(process.execPath, [path.join(root, reviewScript)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
      issues.push(`物理方法模板复核工具: 执行失败 -> ${output}`);
    }
  }
}

function checkReleaseRegressionEvidenceTooling() {
  const reviewScript = 'scripts/check-release-regression-evidence.js';
  const templatePath = process.env.RELEASE_REGRESSION_EVIDENCE
    || 'docs/release-regression/v1.10.0-evidence.template.json';
  assertFile(reviewScript, '发布回归证据工具');
  assertFile(templatePath, '发布回归证据模板');

  if (!fileExists(reviewScript) || !fileExists(templatePath)) {
    return;
  }

  const args = [path.join(root, reviewScript), templatePath];
  if (process.argv.includes('--require-device-evidence')) {
    args.push('--require-device-evidence');
  }

  try {
    execFileSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error) {
    const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
    issues.push(`发布回归证据工具: 执行失败 -> ${output}`);
  }
}

function checkRuntimePackageDependencyTooling() {
  const dependencyScript = 'scripts/check-runtime-package-dependencies.js';
  assertFile(dependencyScript, '运行时分包依赖工具');

  if (fileExists(dependencyScript)) {
    try {
      execFileSync(process.execPath, [path.join(root, dependencyScript)], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
      issues.push(`运行时分包依赖工具: 执行失败 -> ${output}`);
    }
  }
}

function checkReleasePackageEvidenceTooling() {
  if (!process.argv.includes('--require-device-evidence')) {
    return;
  }

  const packageScript = 'scripts/check-release-package-evidence.js';
  const reportPath = process.env.PACKAGE_SIZE_REPORT
    || '.codex-output/release-regression-v1.10.1/packages-preview.json';
  const statusPath = getPreviewStatusPath(reportPath);
  const absoluteStatusPath = path.resolve(root, statusPath);
  assertFile(packageScript, '发布包体证据工具');
  assertFile(reportPath, '发布包体报告');

  if (fs.existsSync(absoluteStatusPath)) {
    const previewStatus = readPreviewStatus(absoluteStatusPath);
    if (previewStatus && previewStatus.status !== 'passed') {
      issues.push(`发布包体预览状态: ${describePreviewStatus(previewStatus, absoluteStatusPath)}`);
    }
  }

  if (!fileExists(packageScript) || !fileExists(reportPath)) {
    return;
  }

  try {
    execFileSync(process.execPath, [
      path.join(root, packageScript),
      reportPath,
      '--require-package-evidence',
    ], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error) {
    const output = String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-3).join(' | ');
    issues.push(`发布包体证据工具: 执行失败 -> ${output}`);
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
  const versionName = RELEASE_INFO && RELEASE_INFO.versionName;
  const serviceScope = RELEASE_INFO && RELEASE_INFO.serviceScope;

  if (!/^\d+\.\d+\.\d+-(?:dev|rc)\.\d+$/.test(versionName || '')) {
    issues.push(`${releaseInfoPath}: versionName 应为 x.y.z-dev.n 或 x.y.z-rc.n`);
  }
  if (!serviceScope || !serviceScope.includes('知识库')) {
    issues.push(`${releaseInfoPath}: serviceScope 应明确为知识库服务范围`);
  }

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
checkCloudPrivacyTooling();
checkReleaseHotfixScopeTooling();
checkContentAuditTooling();
checkPureKnowledgeRuntimeTooling();
checkContentReviewQueueTooling();
checkMathCurriculumAuditTooling();
checkMathContainerReviewTooling();
checkMathTopicReviewTooling();
checkMathTemplateReviewTooling();
checkEnglishTopicReviewTooling();
checkPhysicsTopicReviewTooling();
checkEnglishTemplateReviewTooling();
checkPhysicsTemplateReviewTooling();
checkReleaseRegressionEvidenceTooling();
checkRuntimePackageDependencyTooling();
checkReleasePackageEvidenceTooling();
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
