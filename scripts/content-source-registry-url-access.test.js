const assert = require('assert');

const {
  REGISTRY_ACCESS_AUDIT_SCHEMA_VERSION,
  auditRegisteredSourceUrls,
  collectRegisteredSourceUrls,
} = require('./content-source-registry-url-access');

const sources = [
  {
    key: 'pep-english',
    title: '人教社英语教材资源',
    kind: 'official',
    url: 'https://www.pep.com.cn/english',
  },
  {
    key: 'moe-english',
    title: '教育部英语课程标准',
    kind: 'official',
    url: 'https://www.moe.gov.cn/english',
  },
  {
    key: 'moe-physics',
    title: '教育部物理课程标准',
    kind: 'official',
    url: 'https://www.moe.gov.cn/english',
  },
];

assert.deepStrictEqual(collectRegisteredSourceUrls(sources), [
  {
    url: 'https://www.moe.gov.cn/english',
    sourceKeys: ['moe-english', 'moe-physics'],
  },
  {
    url: 'https://www.pep.com.cn/english',
    sourceKeys: ['pep-english'],
  },
]);

(async () => {
  const report = await auditRegisteredSourceUrls({
    sources,
    requestUrl: async (url) => {
      if (url.includes('pep.com.cn')) return { statusCode: 200, finalUrl: url };
      throw new Error('timeout');
    },
  });

  assert.strictEqual(report.schemaVersion, REGISTRY_ACCESS_AUDIT_SCHEMA_VERSION);
  assert.strictEqual(report.auditKind, 'content-source-registry');
  assert.strictEqual(report.status, 'blocked');
  assert.deepStrictEqual(report.summary, {
    total: 2,
    checked: 2,
    passed: 1,
    failed: 1,
  });
  assert.deepStrictEqual(report.urls[0], {
    url: 'https://www.moe.gov.cn/english',
    sourceKeys: ['moe-english', 'moe-physics'],
    status: 'failed',
    httpStatus: null,
    error: 'timeout',
  });
  assert.strictEqual(report.urls[1].status, 'passed');
  assert.strictEqual(report.urls[1].httpStatus, 200);
  assert.match(report.generatedFrom.registryHash, /^[a-f0-9]{64}$/);

  assert.throws(
    () => collectRegisteredSourceUrls([{
      key: 'bad',
      title: 'bad',
      kind: 'official',
      url: 'http://example.com/source',
    }]),
    /https/,
  );
  assert.throws(
    () => collectRegisteredSourceUrls([{
      key: 'internal',
      title: 'internal',
      kind: 'internal',
      url: null,
    }]),
    /official or reference/,
  );

  console.log('OK content source registry URL access contract');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
