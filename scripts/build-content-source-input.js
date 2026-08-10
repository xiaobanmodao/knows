const fs = require('fs');
const path = require('path');

const {
  checkSourceInput,
  loadSourceInputFile,
  normalizeSourceInput,
} = require('./content-source-input');
const {
  buildContentSourceCatalog,
  filterContentSourceCatalog,
} = require('./content-source-catalog');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const inputPath = args[0];
const fromCurrent = args.includes('--from-current');

function getOption(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function main() {
  if ((!inputPath || inputPath.startsWith('--')) && !fromCurrent) {
    throw new Error('用法：node scripts/build-content-source-input.js <input.json|input.csv> [--output <output.json>] [--source-version <version>] 或 --from-current [--subject <subjectId>] [--type <type>]');
  }
  const outputPath = path.resolve(getOption('--output') || 'dist/content-audit/content-source-input.json');
  const report = fromCurrent
    ? normalizeSourceInput(filterContentSourceCatalog(buildContentSourceCatalog(), {
      subjectId: getOption('--subject'),
      type: getOption('--type'),
    }))
    : loadSourceInputFile(inputPath, { sourceVersion: getOption('--source-version') });
  checkSourceInput(report);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`OK wrote ${path.relative(root, outputPath)} (${report.entityCount} entities, ${report.aliasCount} aliases)`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
