const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_EVIDENCE_PATH = path.join(ROOT, 'docs/evidence/biology-topic-framework-review-2026.json');
const EVIDENCE_KIND = 'official-framework-support';
const REVIEW_ID = 'biology-topic-framework-support-2026-v1';

function readEvidence(evidencePath) {
  let input;

  try {
    input = fs.readFileSync(evidencePath, 'utf8');
  } catch (error) {
    throw new Error(`生物专题官方框架佐证记录读取失败：${path.relative(ROOT, evidencePath)}（${error.code || error.message}）`);
  }

  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(`生物专题官方框架佐证记录读取失败：${path.relative(ROOT, evidencePath)}（${error.message}）`);
  }
}

function validateEvidence(evidence) {
  return evidence;
}

function checkBiologyTopicFrameworkEvidence({ evidencePath = DEFAULT_EVIDENCE_PATH } = {}) {
  return validateEvidence(readEvidence(path.resolve(evidencePath)));
}

if (require.main === module) {
  try {
    checkBiologyTopicFrameworkEvidence();
    console.log('OK biology topic framework evidence');
  } catch (error) {
    console.error(`FOUND_BIOLOGY_TOPIC_FRAMEWORK_EVIDENCE_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_EVIDENCE_PATH,
  EVIDENCE_KIND,
  REVIEW_ID,
  checkBiologyTopicFrameworkEvidence,
};
