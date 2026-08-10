const {
  ENGLISH_SOURCE_EVIDENCE,
  checkEnglishSourceEvidence,
} = require('../packages/english/data/english-source-evidence');

checkEnglishSourceEvidence();

const verified = ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'verified');
const partial = ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'partial');
const pending = ENGLISH_SOURCE_EVIDENCE.filter((item) => item.status === 'pending');
const observedUnitCount = ENGLISH_SOURCE_EVIDENCE.reduce((sum, item) => sum + item.unitCount, 0);

console.log(`OK english source evidence: ${verified.length} verified books, ${partial.length} partial book, ${pending.length} pending book, ${observedUnitCount} units observed`);
