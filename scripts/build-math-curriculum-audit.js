const fs = require('fs');
const path = require('path');

const {
  collectMathCurriculumAudit,
  checkMathCurriculumAudit,
} = require('./math-curriculum-audit');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'dist/content-audit/math-curriculum-diff.json');
const report = collectMathCurriculumAudit();
checkMathCurriculumAudit(report);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`OK wrote ${path.relative(root, outputPath)} (${report.current.chapterCount} stable chapters)`);
