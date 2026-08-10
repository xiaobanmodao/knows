const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { buildContentSourceIntakeGuide } = require('./content-source-intake-guide');

const report = {
  schemaVersion: 1,
  sourceVersion: 'fixture-v1',
  status: 'blocked',
  manifestHash: 'manifest-hash',
  currentSourceHash: 'current-hash',
  summary: {
    total: 2,
    ready: 0,
    blocked: 2,
    pending: 0,
    changed: 0,
    failed: 0,
    externalSourceMissing: 2,
    nextBatchId: 'math-chapters-v1.11',
  },
  batches: [
    {
      id: 'english-units-v1.11',
      subjectId: 'english',
      type: 'unit',
      action: 'provide-external-source',
      priority: 'P1',
      sourceRequirements: {
        evidenceStatus: 'source-evidence-required',
        sourceCandidates: [{ key: 'pep-english-new-textbook-2025', title: '英语新版教材介绍', url: 'https://www.pep.com.cn/english' }],
        requiredFields: ['教材版本与册次', '官方单元序号和单元标题'],
        note: '保留官方目录定位和复核日期',
        blockedActions: ['创建空单元'],
      },
      path: 'english-units.json',
      sourceKind: 'current-fixture',
      status: 'passed',
      counts: { entities: 42 },
      diff: { added: 0, modified: 0, removed: 0 },
      expected: { entities: 42, examples: 0, experiments: 0, assets: 42 },
    },
    {
      id: 'math-chapters-v1.11',
      subjectId: 'math',
      type: 'chapter',
      action: 'provide-external-source',
      priority: 'P0',
      sourceRequirements: {
        evidenceStatus: 'needs-official-volume-map',
        sourceCandidates: [{ key: 'moe-textbook-catalog-2024', title: '国家课程教材目录', url: 'https://www.moe.gov.cn/catalog' }],
        requiredFields: ['教材版本与册次', '官方章序和章标题'],
        note: '必须取得逐册官方完整目录',
        blockedActions: ['重排章节显示顺序'],
      },
      path: 'math-chapters.json',
      sourceKind: 'current-fixture',
      status: 'passed',
      counts: { entities: 29 },
      diff: { added: 0, modified: 0, removed: 0 },
      expected: { entities: 29, examples: 0, experiments: 0, assets: 657 },
    },
  ],
};

const guide = buildContentSourceIntakeGuide({ followUpReport: report });
assert.match(guide, /^# 知识通外部资料接入清单/m);
assert.match(guide, /状态：`blocked`/);
assert.match(guide, /首要批次：`math-chapters-v1\.11`/);
assert.ok(guide.indexOf('math-chapters-v1.11') < guide.indexOf('english-units-v1.11'));
assert.match(guide, /必须取得逐册官方完整目录/);
assert.match(guide, /https:\/\/www\.moe\.gov\.cn\/catalog/);
assert.match(guide, /禁止动作：创建空单元/);
assert.match(guide, /`sourceKind` 必须为 `external-source`/);
assert.match(guide, /`sourceVersion` 不得等于 `v1\.11-current`/);
assert.ok(!guide.includes('完整例句'));

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-content-source-guide-'));
try {
  const inputPath = path.join(tempDirectory, 'follow-up.json');
  const outputPath = path.join(tempDirectory, 'intake-guide.md');
  fs.writeFileSync(inputPath, `${JSON.stringify(report)}\n`);
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'build-content-source-intake-guide.js'),
    inputPath,
    '--output',
    outputPath,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /OK content source intake guide/);
  assert.strictEqual(fs.readFileSync(outputPath, 'utf8'), guide);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK content source intake guide contract');
