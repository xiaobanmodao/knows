const {
  checkEvidence,
  readEvidence,
} = require('./math-pep-product-index-evidence');

checkEvidence(readEvidence(process.argv[2]));
console.log('OK math PEP product index evidence: 6 product pages; volume map remains blocked');
