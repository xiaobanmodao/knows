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
const { getContentSourceBatch } = require('./check-content-source-batches');

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
    throw new Error('用法：node scripts/build-content-source-input.js <input.json|input.csv> [--output <output.json>] [--source-version <version>] [--batch <batchId>] 或 --from-current [--subject <subjectId>] [--type <type>] [--batch <batchId>]');
  }
  const batchId = getOption('--batch');
  const batch = batchId ? getContentSourceBatch(batchId) : null;
  if (batchId && !batch) throw new Error(`未知内容源批次：${batchId}`);
  if (batch && (getOption('--subject') || getOption('--type'))) {
    throw new Error('--batch 不得与 --subject/--type 同时使用');
  }
  const outputPath = path.resolve(getOption('--output') || 'dist/content-audit/content-source-input.json');
  const report = fromCurrent
    ? normalizeSourceInput(filterContentSourceCatalog(buildContentSourceCatalog(), {
      subjectId: batch ? batch.subjectId : getOption('--subject'),
      type: batch ? batch.type : getOption('--type'),
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
