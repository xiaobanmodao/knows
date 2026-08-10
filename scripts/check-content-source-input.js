const assert = require('assert');

const {
  buildContentSourceCatalog,
  buildContentSourceCatalogFromInput,
  diffContentSourceCatalog,
} = require('./content-source-catalog');
const { loadSourceInputFile } = require('./content-source-input');

const inputPath = process.argv[2];

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  if (!inputPath || inputPath.startsWith('--')) {
    throw new Error('用法：node scripts/check-content-source-input.js <input.json|input.csv> [--source-version <version>] [--require-no-diff]');
  }
  const input = loadSourceInputFile(inputPath, { sourceVersion: getOption('--source-version') });
  const importedCatalog = buildContentSourceCatalogFromInput(input);
  const currentCatalog = buildContentSourceCatalog();
  const diff = diffContentSourceCatalog(currentCatalog, importedCatalog);
  if (process.argv.includes('--require-no-diff')) {
    assert.deepStrictEqual(diff.counts, { added: 0, modified: 0, removed: 0 }, '导入内容与当前内容源存在差异');
  }
  console.log(`OK content source input: ${input.entityCount} entities, ${input.aliasCount} aliases, diff +${diff.counts.added} ~${diff.counts.modified} -${diff.counts.removed}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
