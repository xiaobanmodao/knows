const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const RELEASE_OUTPUT_DIR = '.codex-output/release-regression-v1.10.1';
const RELEASE_ENV_KEYS = Object.freeze([
  'RELEASE_TOOL_STATE',
  'RELEASE_REGRESSION_EVIDENCE',
  'PACKAGE_SIZE_REPORT',
  'CLOUD_ASSET_DEPLOYMENT_EVIDENCE',
  'CLOUD_ASSET_DEPLOYMENT_MANIFEST',
]);

const DEFAULT_CHECKS = [
  { script: 'scripts/check-v1.11-quality-matrix.test.js', label: '质量矩阵契约' },
  { script: 'scripts/prepare-remote-assets.js', label: '远程资源清单' },
  { script: 'scripts/check-remote-assets.js', label: '远程资源完整性' },
  { script: 'scripts/check-math-content.js', label: '数学内容' },
  { script: 'scripts/check-math-accuracy.js', label: '数学准确性' },
  { script: 'scripts/check-math-depth.js', label: '数学深度' },
  { script: 'scripts/math-volume-map.test.js', label: '数学目录映射' },
  { script: 'scripts/check-math-volume-map-input.test.js', label: '数学逐册目录输入契约' },
  { script: 'scripts/math-volume-map-diff.test.js', label: '数学逐册目录差异契约' },
  { script: 'scripts/math-volume-map-review.test.js', label: '数学逐册目录人工确认契约' },
  { script: 'scripts/check-math-smartedu-catalog-evidence.test.js', label: '数学官方平台目录证据契约' },
  { script: 'scripts/math-smartedu-resource-discovery.test.js', label: '数学官方平台资源发现契约' },
  { script: 'scripts/math-smartedu-edition-evidence.test.js', label: '数学官方平台版本预览证据契约' },
  { script: 'scripts/math-smartedu-catalog-live.test.js', label: '数学官方平台目录在线/离线复核契约' },
  { script: 'scripts/check-math-smartedu-catalog-evidence.js', label: '数学官方平台目录证据' },
  { script: 'scripts/check-math-smartedu-resource-discovery.js', args: ['docs/evidence/math-smartedu-resource-discovery-2026.json', 'docs/evidence/math-smartedu-catalog-2026.json'], label: '数学官方平台资源发现证据' },
  { script: 'scripts/check-math-smartedu-edition-evidence.js', args: ['docs/evidence/math-smartedu-edition-evidence-2026.json', 'docs/evidence/math-smartedu-catalog-2026.json'], label: '数学官方平台版本预览证据' },
  { script: 'scripts/check-math-confirmed-changes.test.js', label: '数学官方结构变化覆盖契约' },
  { script: 'scripts/check-math-confirmed-changes.js', label: '数学官方结构变化覆盖' },
  { script: 'scripts/math-pep-product-index-evidence.test.js', label: '数学人教社产品索引证据契约' },
  { script: 'scripts/check-math-pep-product-index-evidence.js', label: '数学人教社产品索引证据' },
  { script: 'scripts/math-moe-catalog-mirror-evidence.test.js', label: '数学教育部目录镜像证据契约' },
  { script: 'scripts/check-math-moe-catalog-mirror-evidence.js', label: '数学教育部目录镜像证据' },
  { script: 'scripts/build-math-curriculum-audit.js', label: '数学目录审计产物' },
  { script: 'scripts/check-math-curriculum-audit.js', label: '数学目录审计校验' },
  { script: 'scripts/check-english-units.js', label: '英语单元' },
  { script: 'scripts/check-english-accuracy.js', label: '英语准确性' },
  { script: 'scripts/check-english-depth.js', label: '英语深度' },
  { script: 'scripts/check-english-depth-contract.test.js', label: '英语补深契约' },
  { script: 'scripts/english-curriculum-map.test.js', label: '英语目录映射' },
  { script: 'scripts/check-english-source-evidence.js', label: '英语教材来源证据' },
  { script: 'scripts/check-english-source-evidence.test.js', label: '英语教材来源证据契约' },
  { script: 'scripts/check-english-topic-review.js', label: '英语专题复核' },
  { script: 'scripts/check-english-template-review.js', label: '英语方法复核' },
  { script: 'scripts/check-physics-curriculum.js', label: '物理目录' },
  { script: 'scripts/check-physics-accuracy.js', label: '物理准确性' },
  { script: 'scripts/check-physics-depth.js', label: '物理深度' },
  { script: 'scripts/check-physics-formula-contract.test.js', label: '物理公式契约' },
  { script: 'scripts/check-physics-topic-framework-evidence.test.js', label: '物理专题官方框架佐证契约' },
  { script: 'scripts/check-chemistry-topic-framework-evidence.test.js', label: '化学专题官方框架佐证契约' },
  { script: 'scripts/check-biology-topic-framework-evidence.test.js', label: '生物专题官方框架佐证契约' },
  { script: 'scripts/check-physics-topic-review.js', label: '物理专题复核' },
  { script: 'scripts/check-physics-template-review.js', label: '物理方法复核' },
  { script: 'scripts/check-subject-high-risk-batches.test.js', label: '英语物理高风险批次契约' },
  { script: 'scripts/check-chemistry-biology-high-risk-batches.test.js', label: '化学生物高风险批次契约' },
  { script: 'scripts/check-chemistry-content.js', label: '化学内容' },
  { script: 'scripts/check-chemistry-accuracy.js', label: '化学准确性' },
  { script: 'scripts/check-chemistry-build-contract.test.js', label: '化学构建契约' },
  { script: 'scripts/check-chemistry-foundations.js', label: '化学基础' },
  { script: 'scripts/check-chemistry-pages.js', label: '化学页面' },
  { script: 'scripts/check-chemistry-assets.js', label: '化学资源' },
  { script: 'scripts/check-chemistry-visual-guides.test.js', label: '化学图解契约' },
  { script: 'scripts/check-chemistry-visual-guides.js', label: '化学图解内容与页面' },
  { script: 'scripts/check-biology-visual-guides.test.js', label: '生物图解契约' },
  { script: 'scripts/check-biology-visual-guides.js', label: '生物图解内容与页面' },
  { script: 'scripts/check-biology-content.js', label: '生物内容' },
  { script: 'scripts/check-biology-assets.js', label: '生物资源' },
  { script: 'scripts/check-biology-build-contract.test.js', label: '生物构建契约' },
  { script: 'scripts/check-unique-figures.js', label: '图片唯一性' },
  { script: 'scripts/check-content-review-meta.js', label: '复核元数据' },
  { script: 'scripts/check-content-schema.js', label: '内容结构' },
  { script: 'scripts/check-subject-content.js', label: '五科全局内容契约' },
  { script: 'scripts/content-source-registry.test.js', label: '内容来源注册表契约' },
  { script: 'scripts/content-source-input.test.js', label: '内容源输入契约' },
  { script: 'scripts/content-source-input-audit.test.js', label: '内容源输入审计报告' },
  { script: 'scripts/content-source-input-cli.test.js', label: '内容源输入构建' },
  { script: 'scripts/build-content-source-external-manifest.test.js', label: '外部内容源 manifest 契约' },
  { script: 'scripts/content-source-input-batches.test.js', label: '内容源多批输入契约' },
  { script: 'scripts/content-source-follow-up.test.js', label: '内容源跟进报告契约' },
  { script: 'scripts/check-content-source-follow-up.test.js', label: '内容源跟进校验契约' },
  { script: 'scripts/content-source-input-manifest.test.js', label: '内容源 manifest 构建' },
  { script: 'scripts/build-content-source-input-manifest.js', label: '当前内容源 manifest 产物' },
  { script: 'scripts/build-content-source-follow-up.js', args: ['dist/content-audit/content-source-input-batches/manifest.json', '--report', 'dist/content-audit/content-source-follow-up.json'], label: '内容源跟进报告产物' },
  { script: 'scripts/check-content-source-follow-up.js', args: ['dist/content-audit/content-source-input-batches/manifest.json', 'dist/content-audit/content-source-follow-up.json'], label: '内容源跟进报告产物校验' },
  { script: 'scripts/content-source-intake-pack.test.js', label: '内容源接入包契约' },
  { script: 'scripts/build-content-source-intake-pack.js', args: ['dist/content-audit/content-source-follow-up.json', '--report', 'dist/content-audit/content-source-intake-pack.json'], label: '内容源接入包产物' },
  { script: 'scripts/content-source-intake-guide.test.js', label: '内容源接入清单契约' },
  { script: 'scripts/build-content-source-intake-guide.js', args: ['dist/content-audit/content-source-follow-up.json', '--output', 'dist/content-audit/content-source-intake-guide.md'], label: '内容源接入清单产物' },
  { script: 'scripts/content-source-url-access.test.js', label: '内容源 URL 可访问性契约' },
  { script: 'scripts/content-source-registry-url-access.test.js', label: '内容源注册表 URL 可访问性契约' },
  { script: 'scripts/check-content-source-batches.test.js', label: '内容源批次审计' },
  { script: 'scripts/check-content-source-batches.js', args: ['--report', 'dist/content-audit/content-source-batches.json'], label: '内容源批次报告' },
  { script: 'scripts/content-source-catalog.test.js', label: '内容源目录契约' },
  {
    script: 'scripts/check-content-audit.js',
    args: ['--require-reviewed'],
    before: [{ script: 'scripts/build-content-audit.js' }],
    label: '严格内容审计',
  },
  { script: 'scripts/check-search-index.js', label: '搜索索引' },
  { script: 'scripts/check-search-semantics.js', label: '搜索语义' },
  { script: 'scripts/check-search-experience.js', label: '搜索体验' },
  { script: 'scripts/check-reference-index.js', label: '参考索引' },
  { script: 'scripts/check-content-routes.js', label: '内容路由' },
  { script: 'scripts/check-subject-index-fallbacks.test.js', label: '学科首页失败兜底契约' },
  { script: 'scripts/check-detail-page-fallbacks.test.js', label: '详情页失败兜底契约' },
  { script: 'scripts/check-catalog-page-fallbacks.test.js', label: '目录页失败兜底契约' },
  { script: 'scripts/check-package-manifest.js', label: '包注册表' },
  { script: 'scripts/check-package-source-estimate.test.js', label: '源码包体估算契约' },
  { script: 'scripts/check-package-source-estimate.js', label: '源码包体估算' },
  { script: 'scripts/check-package-boundaries.js', label: '分包边界' },
  { script: 'scripts/check-search-aliases-package-boundary.test.js', label: '搜索别名分包边界' },
  { script: 'scripts/check-subject-adapters.js', label: '学科适配器' },
  { script: 'scripts/check-runtime-package-dependencies.js', label: '运行时分包依赖' },
  { script: 'scripts/check-runtime-js-syntax.test.js', label: '运行时 JavaScript 语法契约' },
  { script: 'scripts/check-runtime-js-syntax.js', label: '运行时 JavaScript 语法' },
  { script: 'scripts/check-pure-knowledge-runtime.test.js', label: '纯知识运行层契约' },
  { script: 'scripts/check-pure-knowledge-runtime.js', label: '纯知识运行层文案' },
  { script: 'scripts/check-cloud-user-trace.test.js', label: '云开发用户追踪契约' },
  { script: 'scripts/check-cloud-user-trace.js', label: '云开发用户追踪隐私审计' },
  { script: 'scripts/check-privacy-interfaces.test.js', label: '隐私接口契约' },
  { script: 'scripts/check-privacy-interfaces.js', label: '隐私接口审计' },
  { script: 'scripts/check-student-copy.js', label: '学生可见文案' },
  { script: 'scripts/check-content-migration.js', label: '本地内容迁移' },
  { script: 'scripts/check-note-filters.js', label: '笔记筛选' },
  { script: 'scripts/check-local-backup.js', label: '本地备份恢复' },
  { script: 'scripts/check-reading-display.js', label: '阅读显示设置' },
  { script: 'scripts/check-cloud-assets-runtime.js', label: '云图片降级' },
  { script: 'scripts/cloud-asset-deployment.test.js', label: '云资源部署证据契约' },
  { script: 'scripts/check-release-readiness.js', label: '发布准备' },
  { script: 'scripts/check-release-package-evidence.test.js', label: '发布包体证据契约' },
  { script: 'scripts/check-release-regression-evidence.test.js', label: '实体回归证据契约' },
  { script: 'scripts/run-release-preview.test.js', label: '开发者工具预览契约' },
  { script: 'scripts/check-release-tool-state.test.js', label: '开发者工具状态诊断契约' },
  { script: 'scripts/check-release-tool-state-evidence.test.js', label: '开发者工具发布证据契约' },
  { script: 'scripts/check-roadmap-status.test.js', label: '路线状态汇总契约' },
  { script: 'scripts/check-roadmap-document-consistency.test.js', label: '路线文档一致性契约' },
  { script: 'scripts/check-content-source-catalog.js', label: '内容源目录产物' },
  { script: 'scripts/check-content-diff.js', label: '内容差异报告' },
  { script: 'scripts/check-subject-high-risk-batches.js', args: ['--report', 'dist/content-audit/subject-high-risk-batches.json'], label: '英语物理高风险批次报告' },
  { script: 'scripts/check-chemistry-biology-high-risk-batches.js', args: ['--report', 'dist/content-audit/chemistry-biology-high-risk-batches.json'], label: '化学生物高风险批次报告' },
];

const RELEASE_CHECKS = [
  { script: 'scripts/check-release-readiness.js', args: ['--require-device-evidence'], label: '实体设备与包体严格门禁' },
];

function cloneCheckCommand(item) {
  const command = { ...item, args: [...(item.args || [])] };
  if (item.before) {
    command.before = item.before.map((before) => ({ ...before, args: [...(before.args || [])] }));
  }
  return command;
}

function getCheckCommands(requireReleaseEvidence = false) {
  if (!requireReleaseEvidence) return DEFAULT_CHECKS.map(cloneCheckCommand);

  const base = DEFAULT_CHECKS.filter((item) => item.script !== 'scripts/check-release-readiness.js');
  return [...base, ...RELEASE_CHECKS].map(cloneCheckCommand);
}

function getMatrixEnvironment(args = process.argv, baseEnvironment = process.env) {
  const environment = { ...baseEnvironment };
  const releaseProjectOption = args.indexOf('--release-project');
  if (releaseProjectOption < 0) return environment;
  const releaseProject = args[releaseProjectOption + 1];
  if (!releaseProject || releaseProject.startsWith('--')) {
    throw new Error('--release-project 必须提供发布工作树路径');
  }
  const outputDirectory = path.resolve(releaseProject, RELEASE_OUTPUT_DIR);
  return {
    ...environment,
    RELEASE_TOOL_STATE: path.join(outputDirectory, 'tool-state.json'),
    RELEASE_REGRESSION_EVIDENCE: path.join(outputDirectory, 'evidence.json'),
    PACKAGE_SIZE_REPORT: path.join(outputDirectory, 'packages-preview.json'),
    CLOUD_ASSET_DEPLOYMENT_EVIDENCE: path.join(outputDirectory, 'cloud-asset-evidence.json'),
  };
}

function getCheckEnvironment(item, baseEnvironment = process.env) {
  const environment = { ...baseEnvironment };
  if (item && /\.test\.js$/.test(item.script || '')) {
    RELEASE_ENV_KEYS.forEach((key) => delete environment[key]);
  }
  return environment;
}

function runCommand(item, baseEnvironment = process.env) {
  const args = item.args || [];
  execFileSync(process.execPath, [path.join(root, item.script), ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
    env: getCheckEnvironment(item, baseEnvironment),
  });
}

function runCheck(item, index, total, baseEnvironment = process.env) {
  console.log(`[${index}/${total}] ${item.label}`);
  (item.before || []).forEach((before) => runCommand(before, baseEnvironment));
  runCommand(item, baseEnvironment);
}

function main(requireReleaseEvidence = false, args = process.argv, baseEnvironment = process.env) {
  const commands = getCheckCommands(requireReleaseEvidence);
  const matrixEnvironment = getMatrixEnvironment(args, baseEnvironment);
  commands.forEach((item, index) => runCheck(item, index + 1, commands.length, matrixEnvironment));
  console.log(`OK v1.11 quality matrix: ${commands.length} checks`);
}

if (require.main === module) {
  main(process.argv.includes('--require-release-evidence'));
}

module.exports = {
  DEFAULT_CHECKS,
  RELEASE_OUTPUT_DIR,
  RELEASE_CHECKS,
  getCheckEnvironment,
  getCheckCommands,
  getMatrixEnvironment,
  main,
};
