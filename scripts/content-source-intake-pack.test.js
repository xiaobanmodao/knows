const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { buildContentSourceIntakePack } = require('./content-source-intake-pack');

const followUpReport = {
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
      path: 'english-units.json',
      sourceKind: 'current-fixture',
      status: 'passed',
      action: 'provide-external-source',
      priority: 'P1',
      expected: { entities: 42, examples: 0, experiments: 0, assets: 42 },
      sourceRequirements: {
        evidenceStatus: 'source-evidence-required',
        sourceCandidates: [{ key: 'pep-english-new-textbook-2025', title: 'English', url: 'https://example.com/english' }],
        requiredFields: ['教材版本与册次', '官方单元序号和单元标题'],
        note: '需要官方单元目录和来源定位',
        blockedActions: [],
      },
      diff: { added: 0, modified: 0, removed: 0 },
      inputHash: 'input-hash',
      currentSourceHash: 'current-english-hash',
    },
    {
      id: 'math-chapters-v1.11',
      subjectId: 'math',
      type: 'chapter',
      path: 'math-chapters.json',
      sourceKind: 'current-fixture',
      status: 'passed',
      action: 'provide-external-source',
      priority: 'P1',
      expected: { entities: 29, examples: 0, experiments: 0, assets: 657 },
      sourceRequirements: {
        evidenceStatus: 'needs-official-volume-map',
        sourceCandidates: [{ key: 'moe-textbook-catalog-2024', title: '教材目录', url: 'https://example.com/math' }],
        requiredFields: ['教材版本与册次', '官方章序和章标题'],
        note: '需要逐册官方完整目录后再接入',
        blockedActions: ['重排章节显示顺序', '猜测或创建新版章节标题'],
      },
      diff: { added: 0, modified: 0, removed: 0 },
      inputHash: 'math-input-hash',
      currentSourceHash: 'current-math-hash',
    },
  ],
};

const pack = buildContentSourceIntakePack({ followUpReport });
assert.strictEqual(pack.schemaVersion, 1);
assert.strictEqual(pack.packType, 'content-source-intake');
assert.deepStrictEqual(pack.generatedFrom, {
  followUpSchemaVersion: 1,
  followUpStatus: 'blocked',
  manifestHash: 'manifest-hash',
  currentSourceHash: 'current-hash',
});
assert.strictEqual(pack.summary.nextBatchId, 'math-chapters-v1.11');
assert.deepStrictEqual(pack.actionableBatchIds, ['english-units-v1.11', 'math-chapters-v1.11']);
assert.deepStrictEqual(pack.entries.map((entry) => entry.id), [
  'english-units-v1.11',
  'math-chapters-v1.11',
]);
assert.deepStrictEqual(pack.entries[0].intake.sourceEvidenceTemplate, {
  sourceKeys: [],
  sourceUrls: [],
  reviewedAt: '',
  note: '',
});
assert.strictEqual(pack.entries[0].intake.sourceKind, 'external-source');
assert.deepStrictEqual(pack.entries[0].requirements.requiredFields, [
  '教材版本与册次',
  '官方单元序号和单元标题',
]);
assert.deepStrictEqual(pack.entries[1].requirements.blockedActions, [
  '重排章节显示顺序',
  '猜测或创建新版章节标题',
]);
assert.ok(!('examples' in pack.entries[0]), '接入包不得复制正文或例句');

assert.throws(
  () => buildContentSourceIntakePack({ followUpReport: { ...followUpReport, batches: [] } }),
  /batches 不能为空/,
);
assert.throws(
  () => buildContentSourceIntakePack({ followUpReport: { ...followUpReport, summary: { ...followUpReport.summary, nextBatchId: 'missing' } } }),
  /nextBatchId/,
);

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-content-source-intake-'));
try {
  const inputReport = path.join(tempDirectory, 'follow-up.json');
  const outputReport = path.join(tempDirectory, 'intake-pack.json');
  fs.writeFileSync(inputReport, `${JSON.stringify(followUpReport)}\n`);
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'build-content-source-intake-pack.js'),
    inputReport,
    '--report',
    outputReport,
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /OK content source intake pack/);
  const cliPack = JSON.parse(fs.readFileSync(outputReport, 'utf8'));
  assert.strictEqual(cliPack.packType, 'content-source-intake');
  assert.strictEqual(cliPack.entries.length, 2);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('OK content source intake pack contract');
