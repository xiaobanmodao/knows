const assert = require('assert');
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

console.log('OK physics topic framework evidence contract');
