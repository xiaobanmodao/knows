const assert = require('assert');
const os = require('os');
const path = require('path');

const { checkBiologyTopicFrameworkEvidence } = require('./check-biology-topic-framework-evidence');

const evidencePath = path.join(
  os.tmpdir(),
  `knows-biology-topic-framework-evidence-missing-${process.pid}-${Date.now()}.json`,
);

assert.throws(
  () => checkBiologyTopicFrameworkEvidence({ evidencePath }),
  /生物专题官方框架佐证记录读取失败/,
);
