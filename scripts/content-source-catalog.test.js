const assert = require('assert');

const {
  buildContentSourceCatalog,
  checkContentSourceCatalog,
  diffContentSourceCatalog,
  hashCatalog,
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

const selfDiff = diffContentSourceCatalog(report, report);
assert.deepStrictEqual(selfDiff.counts, { added: 0, modified: 0, removed: 0 });
assert.strictEqual(selfDiff.added.length, 0);
assert.strictEqual(selfDiff.modified.length, 0);
assert.strictEqual(selfDiff.removed.length, 0);

const changed = JSON.parse(JSON.stringify(report));
changed.entities[0] = { ...changed.entities[0], title: `${changed.entities[0].title}（审计变更）` };
changed.entities.pop();
changed.entities.push({
  ...report.entities[0],
  key: 'synthetic:knowledge:new-entry',
  subjectId: 'synthetic',
  type: 'knowledge',
  id: 'new-entry',
  title: 'Synthetic new entry',
});
changed.entityCount = changed.entities.length;
changed.sourceHash = hashCatalog(changed);
checkContentSourceCatalog(changed);

const changedDiff = diffContentSourceCatalog(report, changed);
assert.deepStrictEqual(changedDiff.counts, { added: 1, modified: 1, removed: 1 });
assert.strictEqual(changedDiff.added[0].key, 'synthetic:knowledge:new-entry');
assert.strictEqual(changedDiff.removed[0].key, report.entities[report.entities.length - 1].key);
assert.strictEqual(changedDiff.modified[0].key, report.entities[0].key);
assert.deepStrictEqual(changedDiff.modified[0].changes, ['title']);
assert.ok(/^[a-f0-9]{64}$/.test(changedDiff.sourceHash));

const tamperedDiff = JSON.parse(JSON.stringify(changed));
tamperedDiff.sourceHash = 'f'.repeat(64);
assert.throws(
  () => diffContentSourceCatalog(report, tamperedDiff),
  /sourceHash|内容源目录/,
);

console.log(`OK content source catalog contract: ${report.entityCount} entities, ${report.aliasCount} aliases`);
