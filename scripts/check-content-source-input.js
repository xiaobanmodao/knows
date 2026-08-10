const assert = require('assert');

const {
  buildContentSourceCatalog,
  buildContentSourceCatalogFromInput,
  diffContentSourceCatalog,
  filterContentSourceCatalog,
} = require('./content-source-catalog');
const {
  auditContentSourceBatch,
  getContentSourceBatch,
} = require('./check-content-source-batches');
const { loadSourceInputFile } = require('./content-source-input');

const inputPath = process.argv[2];

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  if (!inputPath || inputPath.startsWith('--')) {
    throw new Error('用法：node scripts/check-content-source-input.js <input.json|input.csv> [--source-version <version>] [--subject <subjectId>] [--type <type>] [--batch <batchId>] [--require-no-diff]');
  }
  const batchId = getOption('--batch');
  const batch = batchId ? getContentSourceBatch(batchId) : null;
  if (batchId && !batch) throw new Error(`未知内容源批次：${batchId}`);
  if (batch && (getOption('--subject') || getOption('--type'))) {
    throw new Error('--batch 不得与 --subject/--type 同时使用');
  }
  const input = loadSourceInputFile(inputPath, { sourceVersion: getOption('--source-version') });
  const importedCatalog = buildContentSourceCatalogFromInput(input);
  const currentCatalog = filterContentSourceCatalog(buildContentSourceCatalog(), {
    subjectId: batch ? batch.subjectId : getOption('--subject'),
    type: batch ? batch.type : getOption('--type'),
  });
  if (batch) {
    const expected = auditContentSourceBatch(batch, currentCatalog);
    assert.strictEqual(input.entityCount, expected.counts.entities, `${batch.id} 导入实体数量不符`);
    assert.strictEqual(input.aliasCount, expected.counts.aliases, `${batch.id} 导入别名数量不符`);
    assert.ok(input.entities.every((entity) => entity.subjectId === batch.subjectId && entity.type === batch.type), `${batch.id} 导入范围不符`);
    const metrics = input.entities.reduce((totals, entity) => ({
      examples: totals.examples + entity.exampleCount,
      experiments: totals.experiments + entity.experimentCount,
      assets: totals.assets + entity.assetCount,
    }), { examples: 0, experiments: 0, assets: 0 });
    assert.deepStrictEqual(metrics, expected.metrics, `${batch.id} 导入统计不符`);
  }
  const diff = diffContentSourceCatalog(currentCatalog, importedCatalog);
  if (process.argv.includes('--require-no-diff')) {
    assert.deepStrictEqual(diff.counts, { added: 0, modified: 0, removed: 0 }, '导入内容与当前内容源存在差异');
  }
  const scope = batch ? batch.id : [getOption('--subject'), getOption('--type')].filter(Boolean).join('/');
  console.log(`OK content source input${scope ? ` (${scope})` : ''}: ${input.entityCount} entities, ${input.aliasCount} aliases, diff +${diff.counts.added} ~${diff.counts.modified} -${diff.counts.removed}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
