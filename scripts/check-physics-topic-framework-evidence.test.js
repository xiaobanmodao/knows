const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  DEFAULT_EVIDENCE_PATH,
  checkPhysicsTopicFrameworkEvidence,
} = require('./check-physics-topic-framework-evidence');

function cloneDefaultEvidence() {
  return JSON.parse(fs.readFileSync(DEFAULT_EVIDENCE_PATH, 'utf8'));
}

function assertRejectedFixture(label, mutate) {
  const fixturePath = path.join(os.tmpdir(), `knows-physics-topic-framework-${label}-${process.pid}-${Date.now()}.json`);
  const fixture = cloneDefaultEvidence();
  mutate(fixture);
  fs.writeFileSync(fixturePath, JSON.stringify(fixture));

  try {
    assert.throws(
      () => checkPhysicsTopicFrameworkEvidence({ evidencePath: fixturePath }),
      /物理专题官方框架佐证记录|不得包含|不支持字段|role|observation|supports/,
      `${label} 必须被拒绝`,
    );
  } finally {
    fs.rmSync(fixturePath, { force: true });
  }
}

const evidencePath = path.join(os.tmpdir(), `knows-physics-topic-framework-evidence-${process.pid}-${Date.now()}.json`);
assert.strictEqual(fs.existsSync(evidencePath), false, 'test evidence path must not exist');

assert.throws(
  () => checkPhysicsTopicFrameworkEvidence({ evidencePath }),
  /物理专题官方框架佐证记录读取失败/,
);

const invalidEvidencePath = path.join(os.tmpdir(), `knows-physics-topic-framework-invalid-${process.pid}-${Date.now()}.json`);
fs.writeFileSync(invalidEvidencePath, '{ invalid json');
try {
  assert.throws(
    () => checkPhysicsTopicFrameworkEvidence({ evidencePath: invalidEvidencePath }),
    /物理专题官方框架佐证记录读取失败/,
  );
} finally {
  fs.rmSync(invalidEvidencePath, { force: true });
}

const defaultRun = childProcess.spawnSync(
  process.execPath,
  [path.join(__dirname, 'check-physics-topic-framework-evidence.js')],
  { encoding: 'utf8' },
);
assert.strictEqual(defaultRun.status, 0, defaultRun.stderr);
assert.match(defaultRun.stdout, /OK physics topic framework evidence: 6 topics/);

assert.deepStrictEqual(checkPhysicsTopicFrameworkEvidence(), {
  topicCount: 6,
  evidenceKind: 'official-framework-support',
  sourceKeys: ['moe-physics-2022', 'pep-physics-public'],
});

assertRejectedFixture('unknown-chinese-mapping', (fixture) => {
  fixture.topics[0].教材章节映射 = '不应接受';
});

assertRejectedFixture('swapped-source-roles', (fixture) => {
  fixture.sources[0].role = 'textbook-framework-summary';
  fixture.sources[1].role = 'curriculum-baseline';
});

assertRejectedFixture('out-of-bound-source-observation', (fixture) => {
  fixture.sources[1].observation = '教材内容已逐章核对。';
});

assertRejectedFixture('external-source-field', (fixture) => {
  fixture.sources[0]['external-source'] = '不应接受';
});

assertRejectedFixture('out-of-bound-supports', (fixture) => {
  fixture.scope.supports = [
    '已完成教材逐章标题、章节顺序和教材册次映射。',
    '属于 external-source 内容导入。',
  ];
});

console.log('OK physics topic framework evidence contract');
