const assert = require('assert');

const {
  buildContentSourceCatalog,
  checkContentSourceCatalog,
} = require('./content-source-catalog');

const report = buildContentSourceCatalog();
checkContentSourceCatalog(report);

assert.strictEqual(report.schemaVersion, 1);
assert.strictEqual(report.entityCount, 948);
assert.strictEqual(report.aliasCount, 89);
assert.strictEqual(report.entities.length, report.entityCount);
assert.strictEqual(report.aliases.length, report.aliasCount);
assert.strictEqual(
  report.entities.find((entity) => entity.id === 'chem-topic-lab').parentId,
  'chem-theme-inquiry',
);
assert.ok(report.entities.every((entity) => /^[a-f0-9]{64}$/.test(entity.contentHash)));
assert.ok(report.entities.every((entity) => !['summary', 'examples', 'sections', 'problems'].some((field) => Object.hasOwn(entity, field))));
assert.ok(report.aliases.every((alias) => alias.targetKey.startsWith('math:knowledge:')));

const tampered = JSON.parse(JSON.stringify(report));
tampered.entities[0].contentHash = '0'.repeat(64);
assert.throws(
  () => checkContentSourceCatalog(tampered),
  /sourceHash|内容源目录实体哈希|内容源目录与当前源不一致/,
);

console.log(`OK content source catalog contract: ${report.entityCount} entities, ${report.aliasCount} aliases`);
