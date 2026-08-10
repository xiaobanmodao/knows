const fs = require('fs');
const path = require('path');

const { buildContentSourceIntakePack } = require('./content-source-intake-pack');

const DEFAULT_INPUT = 'dist/content-audit/content-source-follow-up.json';
const DEFAULT_OUTPUT = 'dist/content-audit/content-source-intake-guide.md';

function text(value, fallback = '(未记录)') {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return String(value).replace(/\r?\n/g, ' ').trim();
}

function inlineCode(value, fallback) {
  return `\`${text(value, fallback)}\``;
}

function list(values, fallback = '(未记录)') {
  if (!Array.isArray(values) || !values.length) return fallback;
  return values.map((value) => text(value)).join('、');
}

function formatCandidates(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) return ['  - (未登记官方来源候选)'];
  return candidates.map((candidate) => (
    `  - [${text(candidate.title, candidate.key)}](${text(candidate.url, '#')}) · key ${inlineCode(candidate.key)}`
  ));
}

function formatScale(scale) {
  if (!scale || typeof scale !== 'object') return '(未记录)';
  return Object.entries(scale)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`)
    .join('、') || '(未记录)';
}

function formatDiff(diff) {
  if (!diff || typeof diff !== 'object') return '(未记录)';
  return `新增 ${diff.added ?? 0}、修改 ${diff.modified ?? 0}、删除 ${diff.removed ?? 0}`;
}

function buildEntryLines(entry, index) {
  const requirements = entry.requirements || {};
  const current = entry.current || {};
  const expected = entry.expected || {};
  return [
    `### ${index}. ${inlineCode(entry.id)} · ${text(entry.subjectId)} / ${text(entry.type)}`,
    `- 处理动作：${inlineCode(entry.action)}；优先级：${inlineCode(entry.priority)}`,
    `- 当前输入：${inlineCode(current.path, '(缺少输入文件)')}；来源类型：${inlineCode(current.sourceKind)}；状态：${inlineCode(current.status)}`,
    `- 当前规模：${formatScale(current.counts)}；当前差异：${formatDiff(current.diff)}`,
    `- 预期规模：${formatScale(expected)}`,
    `- 证据门槛：${inlineCode(requirements.evidenceStatus)}`,
    `- 说明：${text(requirements.note)}`,
    '- 官方来源候选：',
    ...formatCandidates(requirements.sourceCandidates),
    `- 必填证据字段：${list(requirements.requiredFields)}`,
    `- 禁止动作：${list(requirements.blockedActions, '无额外禁止动作；仍须遵守通用边界')}`,
    '- 接入完成条件：`sourceKind` 必须为 `external-source`，`sourceVersion` 不得等于 `v1.11-current`，并提供真实来源 URL、来源 key、复核日期、证据说明和输入哈希。',
    '',
  ];
}

function buildContentSourceIntakeGuide({ followUpReport } = {}) {
  const pack = buildContentSourceIntakePack({ followUpReport });
  const actionableEntries = pack.entries.filter((entry) => entry.action !== 'no-action');
  const nextEntry = actionableEntries.find((entry) => entry.id === pack.summary.nextBatchId);
  const orderedEntries = nextEntry
    ? [nextEntry, ...actionableEntries.filter((entry) => entry.id !== nextEntry.id)]
    : actionableEntries;
  const lines = [
    '# 知识通外部资料接入清单',
    '',
    `- 报告状态：${inlineCode(pack.generatedFrom.followUpStatus)}`,
    `- 内容源版本：${inlineCode(pack.sourceVersion)}`,
    `- 首要批次：${inlineCode(pack.summary.nextBatchId, '无')}`,
    `- 可处理批次：${orderedEntries.length}/${pack.entries.length}`,
    '',
    '## 使用边界',
    '- 教材和官方页面只用于核对范围、父级关系、字段条件和来源定位；不复制课文、题目、解析、听力材料、实验原文或原书插图。',
    '- 当前源夹具只能用于结构干跑，不能把 `current-fixture` 改名为外部资料来解除门禁。',
    '- 资料未能证明版本、册次或章序时，保留稳定 ID 和阻塞状态，不重排目录、不创建空内容。',
    '',
    '## 批次清单',
  ];

  if (!actionableEntries.length) {
    lines.push('- 当前没有待接入批次。');
  } else {
    orderedEntries.forEach((entry, index) => lines.push(...buildEntryLines(entry, index + 1)));
  }

  lines.push(
    '## 提交流程',
    '1. 按批次准备原创整理后的 JSON/CSV 输入和真实来源凭证。',
    '2. 用 `build-content-source-external-manifest.js` 生成带输入哈希的外部 manifest。',
    '3. 运行 `check-content-source-input-batches.js <manifest.json> --require-all-batches --require-no-diff --require-external-source`。',
    '4. 重新生成并校验内容源跟进报告，再运行 `check-roadmap-status.js`。',
    '5. 通过结构、准确性、搜索、资源和回归检查后，才能推送内容变更；外部资料门禁通过前不创建 RC。',
    '',
    '## 当前产物',
    `- 跟进报告 manifest 哈希：${inlineCode(pack.generatedFrom.manifestHash)}`,
    `- 当前源哈希：${inlineCode(pack.generatedFrom.currentSourceHash)}`,
    '- 本清单是执行辅助产物，不是外部来源凭证，也不解除任何发布或内容门禁。',
    '',
  );

  return `${lines.join('\n')}\n`;
}

function readJson(inputPath) {
  return JSON.parse(fs.readFileSync(inputPath, 'utf8'));
}

function runCli() {
  const args = process.argv.slice(2);
  const inputPath = path.resolve(args[0] || DEFAULT_INPUT);
  const outputIndex = args.indexOf('--output');
  const outputPath = path.resolve(outputIndex >= 0 ? args[outputIndex + 1] : DEFAULT_OUTPUT);
  const guide = buildContentSourceIntakeGuide({ followUpReport: readJson(inputPath) });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, guide, 'utf8');
  console.log(`OK content source intake guide: ${outputPath}`);
}

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    console.error(`FOUND_CONTENT_SOURCE_INTAKE_GUIDE_ISSUE\n${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  buildContentSourceIntakeGuide,
  runCli,
};
