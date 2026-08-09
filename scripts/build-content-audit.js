const fs = require('fs');
const path = require('path');

const { collectContentAudit, checkAuditReport } = require('./content-audit');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'dist/content-audit/content-audit.json');
const report = collectContentAudit();
checkAuditReport(report);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`OK wrote ${path.relative(root, outputPath)} (${report.totals.entityCount} entities)`);
