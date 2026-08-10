const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_EVIDENCE_PATH = path.join(ROOT, 'docs/evidence/chemistry-topic-framework-review-2026.json');

function readEvidence(evidencePath) {
  try {
    return JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (error) {
    throw new Error(`化学专题官方框架佐证记录读取失败：${path.relative(ROOT, evidencePath)}（${error.code || error.message}）`);
  }
}

function checkChemistryTopicFrameworkEvidence({ evidencePath = DEFAULT_EVIDENCE_PATH } = {}) {
  return readEvidence(path.resolve(evidencePath));
}

if (require.main === module) {
  try {
    checkChemistryTopicFrameworkEvidence();
    console.log('OK chemistry topic framework evidence');
  } catch (error) {
    console.error(`FOUND_CHEMISTRY_TOPIC_FRAMEWORK_EVIDENCE_ISSUE: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_EVIDENCE_PATH,
  checkChemistryTopicFrameworkEvidence,
};
