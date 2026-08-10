const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  DEFAULT_EVIDENCE_PATH,
  EVIDENCE_KIND,
  REVIEW_ID,
  checkBiologyTopicFrameworkEvidence,
} = require('./check-biology-topic-framework-evidence');

assert.strictEqual(EVIDENCE_KIND, 'official-framework-support');
assert.strictEqual(REVIEW_ID, 'biology-topic-framework-support-2026-v1');
assert.match(DEFAULT_EVIDENCE_PATH, /docs[\\/]evidence[\\/]biology-topic-framework-review-2026\.json$/);

const evidencePath = path.join(
  os.tmpdir(),
  `knows-biology-topic-framework-evidence-missing-${process.pid}-${Date.now()}.json`,
);

assert.throws(
  () => checkBiologyTopicFrameworkEvidence({ evidencePath }),
  /生物专题官方框架佐证记录读取失败/,
);

const defaultRun = spawnSync(process.execPath, [path.join(__dirname, 'check-biology-topic-framework-evidence.js')], {
  encoding: 'utf8',
});
assert.strictEqual(defaultRun.status, 1);
assert.match(defaultRun.stderr, /FOUND_BIOLOGY_TOPIC_FRAMEWORK_EVIDENCE_ISSUE: 生物专题官方框架佐证记录读取失败/);

const fixturePath = path.join(
  os.tmpdir(),
  `knows-biology-topic-framework-evidence-fixture-${process.pid}-${Date.now()}.json`,
);
fs.writeFileSync(fixturePath, JSON.stringify({ fixture: true }));
try {
  assert.deepStrictEqual(checkBiologyTopicFrameworkEvidence({ evidencePath: fixturePath }), { fixture: true });
} finally {
  fs.rmSync(fixturePath, { force: true });
}
