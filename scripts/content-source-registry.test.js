const assert = require('assert');

const { collectAuditEntities, validateSourceReference } = require('./content-audit');
const {
  CONTENT_SOURCE_REGISTRY,
  getContentSource,
  getContentSourceCandidateKeys,
  getContentSourceCandidates,
  getContentSourceCandidatesForSubject,
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
const smartEducation = getContentSource('smartedu-math-textbook-catalog-2026');
assert.strictEqual(smartEducation.url, 'https://basic.smartedu.cn/tchMaterial');
assert.strictEqual(smartEducation.kind, 'official');
assert.strictEqual(getContentSource('not-registered'), null);
assert.deepStrictEqual(
  getContentSourceCandidateKeys('math'),
  [
    'moe-math-curriculum-2022',
    'moe-textbook-catalog-2024',
    'pep-math-new-textbook-2024',
    'smartedu-math-textbook-catalog-2026',
  ],
);
assert.deepStrictEqual(getContentSourceCandidateKeys('not-a-subject'), []);
assert.deepStrictEqual(
  getContentSourceCandidatesForSubject('physics'),
  [
    {
      key: 'moe-physics-2022',
      title: '义务教育物理课程标准（2022年版）',
      url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
    },
    {
      key: 'pep-physics-public',
      title: '人教版初中物理新教材介绍',
      url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240925_1995627.html',
    },
  ],
);
assert.deepStrictEqual(
  getContentSourceCandidates(['moe-math-curriculum-2022', 'pep-math-new-textbook-2024']),
  [
    {
      key: 'moe-math-curriculum-2022',
      title: '义务教育数学课程标准（2022年版）',
      url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf',
    },
    {
      key: 'pep-math-new-textbook-2024',
      title: '人教版义务教育数学（七至九年级）新教材介绍',
      url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202408/t20240826_1994351.html',
    },
  ],
);
assert.throws(() => getContentSourceCandidates(['not-registered']), /官方来源/);
assert.throws(() => getContentSourceCandidates(['pep-math-current-catalog']), /官方来源/);
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
