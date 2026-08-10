const {
  ENGLISH_SOURCE_EVIDENCE,
  checkEnglishSourceEvidence,
} = require('../packages/english/data/english-source-evidence');

checkEnglishSourceEvidence();

const verified = ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'verified');
const pending = ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'pending');
const unitCount = verified.reduce((sum, item) => sum + item.unitCount, 0);

console.log(`OK english source evidence: ${verified.length} verified books, ${pending.length} pending book, ${unitCount} units mapped`);
