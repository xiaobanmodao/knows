const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { checkPhysicsTopicFrameworkEvidence } = require('./check-physics-topic-framework-evidence');

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

console.log('OK physics topic framework evidence contract');
