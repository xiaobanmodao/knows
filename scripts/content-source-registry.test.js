const assert = require('assert');

const { collectAuditEntities, validateSourceReference } = require('./content-audit');
const {
  CONTENT_SOURCE_REGISTRY,
  getContentSource,
  getContentSourceKeys,
  checkContentSourceRegistry,
} = require('../data/content-source-registry');

checkContentSourceRegistry();

const keys = getContentSourceKeys();
assert.ok(keys.length > 0, '来源注册表不能为空');
assert.strictEqual(new Set(keys).size, keys.length, '来源注册表 key 不得重复');
assert.deepStrictEqual(Object.keys(CONTENT_SOURCE_REGISTRY).sort(), keys, '来源注册表 key 导出不稳定');

const referencedKeys = new Set(
  collectAuditEntities().flatMap((entity) => entity.reviewed.sourceRefs.map((source) => source.key)),
);
referencedKeys.forEach((key) => {
  assert.ok(getContentSource(key), `内容实体来源 key 未登记：${key}`);
});

const canonical = getContentSource('pep-english-new-textbook-2025');
assert.strictEqual(canonical.url, 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html');
assert.strictEqual(canonical.kind, 'official');
assert.strictEqual(getContentSource('not-registered'), null);
assert.throws(
  () => validateSourceReference({ key: 'not-registered', title: 'x', url: 'https://example.org' }, 'fixture/entity'),
  /未登记/,
);
assert.throws(
  () => validateSourceReference({ key: 'pep-english-new-textbook-2025', title: '', url: canonical.url }, 'fixture/entity'),
  /缺少标题或 URL/,
);
assert.throws(
  () => validateSourceReference({ key: 'pep-english-new-textbook-2025', title: canonical.title, url: 'https://www.pep.com.cn/other' }, 'fixture/entity'),
  /URL 与注册表不一致/,
);

console.log(`OK content source registry: ${keys.length} sources, ${referencedKeys.size} referenced keys`);
