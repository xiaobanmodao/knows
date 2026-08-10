const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

const DEFAULT_CHECKS = [
  { script: 'scripts/check-v1.11-quality-matrix.test.js', label: '质量矩阵契约' },
  { script: 'scripts/prepare-remote-assets.js', label: '远程资源清单' },
  { script: 'scripts/check-remote-assets.js', label: '远程资源完整性' },
  { script: 'scripts/check-math-content.js', label: '数学内容' },
  { script: 'scripts/check-math-accuracy.js', label: '数学准确性' },
  { script: 'scripts/check-math-depth.js', label: '数学深度' },
  { script: 'scripts/math-volume-map.test.js', label: '数学目录映射' },
  { script: 'scripts/check-english-units.js', label: '英语单元' },
  { script: 'scripts/check-english-accuracy.js', label: '英语准确性' },
  { script: 'scripts/check-english-depth.js', label: '英语深度' },
  { script: 'scripts/check-english-depth-contract.test.js', label: '英语补深契约' },
  { script: 'scripts/english-curriculum-map.test.js', label: '英语目录映射' },
  { script: 'scripts/check-english-topic-review.js', label: '英语专题复核' },
  { script: 'scripts/check-english-template-review.js', label: '英语方法复核' },
  { script: 'scripts/check-physics-curriculum.js', label: '物理目录' },
  { script: 'scripts/check-physics-accuracy.js', label: '物理准确性' },
  { script: 'scripts/check-physics-depth.js', label: '物理深度' },
  { script: 'scripts/check-physics-formula-contract.test.js', label: '物理公式契约' },
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
  { script: 'scripts/check-biology-content.js', label: '生物内容' },
  { script: 'scripts/check-biology-assets.js', label: '生物资源' },
  { script: 'scripts/check-biology-build-contract.test.js', label: '生物构建契约' },
  { script: 'scripts/check-unique-figures.js', label: '图片唯一性' },
  { script: 'scripts/check-content-review-meta.js', label: '复核元数据' },
  { script: 'scripts/check-content-schema.js', label: '内容结构' },
  { script: 'scripts/check-subject-content.js', label: '五科全局内容契约' },
  { script: 'scripts/content-source-input.test.js', label: '内容源输入契约' },
  { script: 'scripts/content-source-input-audit.test.js', label: '内容源输入审计报告' },
  { script: 'scripts/content-source-input-cli.test.js', label: '内容源输入构建' },
  { script: 'scripts/content-source-input-batches.test.js', label: '内容源多批输入契约' },
  { script: 'scripts/check-content-source-batches.test.js', label: '内容源批次审计' },
  { script: 'scripts/check-content-source-batches.js', args: ['--report', 'dist/content-audit/content-source-batches.json'], label: '内容源批次报告' },
  { script: 'scripts/content-source-catalog.test.js', label: '内容源目录契约' },
  { script: 'scripts/check-content-audit.js', args: ['--require-reviewed'], label: '严格内容审计' },
  { script: 'scripts/check-search-index.js', label: '搜索索引' },
  { script: 'scripts/check-search-semantics.js', label: '搜索语义' },
  { script: 'scripts/check-search-experience.js', label: '搜索体验' },
  { script: 'scripts/check-reference-index.js', label: '参考索引' },
  { script: 'scripts/check-content-routes.js', label: '内容路由' },
  { script: 'scripts/check-package-manifest.js', label: '包注册表' },
  { script: 'scripts/check-package-boundaries.js', label: '分包边界' },
  { script: 'scripts/check-subject-adapters.js', label: '学科适配器' },
  { script: 'scripts/check-runtime-package-dependencies.js', label: '运行时分包依赖' },
  { script: 'scripts/check-pure-knowledge-runtime.test.js', label: '纯知识运行层契约' },
  { script: 'scripts/check-pure-knowledge-runtime.js', label: '纯知识运行层文案' },
  { script: 'scripts/check-student-copy.js', label: '学生可见文案' },
  { script: 'scripts/check-content-migration.js', label: '本地内容迁移' },
  { script: 'scripts/check-note-filters.js', label: '笔记筛选' },
  { script: 'scripts/check-local-backup.js', label: '本地备份恢复' },
  { script: 'scripts/check-reading-display.js', label: '阅读显示设置' },
  { script: 'scripts/check-cloud-assets-runtime.js', label: '云图片降级' },
  { script: 'scripts/check-release-readiness.js', label: '发布准备' },
  { script: 'scripts/check-release-tool-state.test.js', label: '开发者工具状态诊断契约' },
  { script: 'scripts/check-content-source-catalog.js', label: '内容源目录产物' },
  { script: 'scripts/check-content-diff.js', label: '内容差异报告' },
  { script: 'scripts/check-subject-high-risk-batches.js', args: ['--report', 'dist/content-audit/subject-high-risk-batches.json'], label: '英语物理高风险批次报告' },
  { script: 'scripts/check-chemistry-biology-high-risk-batches.js', args: ['--report', 'dist/content-audit/chemistry-biology-high-risk-batches.json'], label: '化学生物高风险批次报告' },
];

const RELEASE_CHECKS = [
  { script: 'scripts/check-release-readiness.js', args: ['--require-device-evidence'], label: '实体设备与包体严格门禁' },
];

function getCheckCommands(requireReleaseEvidence = false) {
  if (!requireReleaseEvidence) return DEFAULT_CHECKS.map((item) => ({ ...item, args: [...(item.args || [])] }));

  const base = DEFAULT_CHECKS.filter((item) => item.script !== 'scripts/check-release-readiness.js');
  return [...base, ...RELEASE_CHECKS].map((item) => ({ ...item, args: [...(item.args || [])] }));
}

function runCheck(item, index, total) {
  const args = item.args || [];
  console.log(`[${index}/${total}] ${item.label}`);
  execFileSync(process.execPath, [path.join(root, item.script), ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  });
}

function main(requireReleaseEvidence = false) {
  const commands = getCheckCommands(requireReleaseEvidence);
  commands.forEach((item, index) => runCheck(item, index + 1, commands.length));
  console.log(`OK v1.11 quality matrix: ${commands.length} checks`);
}

if (require.main === module) {
  main(process.argv.includes('--require-release-evidence'));
}

module.exports = {
  DEFAULT_CHECKS,
  RELEASE_CHECKS,
  getCheckCommands,
  main,
};
