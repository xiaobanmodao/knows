const fs = require('fs');
const path = require('path');

const { checkReport } = require('./math-smartedu-resource-discovery');

function main() {
  const reportPath = path.resolve(process.argv[2] || 'docs/evidence/math-smartedu-resource-discovery-2026.json');
  const evidencePath = path.resolve(process.argv[3] || 'docs/evidence/math-smartedu-catalog-2026.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  checkReport(evidence, report);
  console.log(`OK math SmartEdu resource discovery: ${report.candidateCount} normal-school candidates checked; no additional candidates`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FOUND_MATH_SMARTEDU_RESOURCE_DISCOVERY_ISSUE\n${error.message}`);
    process.exitCode = 1;
  }
}
