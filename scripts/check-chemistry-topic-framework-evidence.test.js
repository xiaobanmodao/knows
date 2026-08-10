const assert = require('assert');
const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');

const { checkChemistryTopicFrameworkEvidence } = require('./check-chemistry-topic-framework-evidence');

const missingEvidencePath = path.join(
  os.tmpdir(),
  `knows-chemistry-topic-framework-evidence-${process.pid}-${Date.now()}.json`,
);

assert.throws(
  () => checkChemistryTopicFrameworkEvidence({ evidencePath: missingEvidencePath }),
  /化学专题官方框架佐证记录读取失败/,
);

const defaultRun = spawnSync(process.execPath, [path.join(__dirname, 'check-chemistry-topic-framework-evidence.js')], {
  encoding: 'utf8',
});
assert.strictEqual(defaultRun.status, 1, 'default checker must fail before evidence is added');
assert.match(defaultRun.stderr, /化学专题官方框架佐证记录读取失败/);

console.log('OK chemistry topic framework evidence contract');
