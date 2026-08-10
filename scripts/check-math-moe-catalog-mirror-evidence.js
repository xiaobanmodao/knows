const {
  checkEvidence,
  readEvidence,
} = require('./math-moe-catalog-mirror-evidence');

checkEvidence(readEvidence(process.argv[2]));
console.log('OK math MOE catalog mirror evidence: PEP math volume scope verified; volume map remains blocked');
