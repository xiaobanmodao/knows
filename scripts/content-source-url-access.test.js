const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  ACCESS_AUDIT_SCHEMA_VERSION,
  auditSourceUrls,
  collectSourceUrls,
  requestSourceUrl,
} = require('./content-source-url-access');

(async () => {
const manifest = {
  schemaVersion: 1,
  sourceVersion: 'url-access-fixture-v1',
  sourceKind: 'external-source',
  batches: [
    {
      id: 'english-units-v1.11',
      path: 'english-units.json',
      sourceKind: 'external-source',
      sourceEvidence: {
        sourceKeys: ['pep-english'],
        sourceUrls: [
          'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html',
          'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
        ],
        reviewedAt: '2026-08-10',
        note: 'URL access contract',
      },
    },
    {
      id: 'english-words-v1.11',
      path: 'english-words.json',
      sourceKind: 'external-source',
      sourceEvidence: {
        sourceKeys: ['cambridge'],
        sourceUrls: ['https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html'],
        reviewedAt: '2026-08-10',
        note: 'duplicate URL must be checked once',
      },
    },
    {
      id: 'math-chapters-v1.11',
      path: 'math-chapters.json',
      sourceKind: 'current-fixture',
    },
  ],
};

const urls = collectSourceUrls(manifest);
assert.deepStrictEqual(urls, [
  'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
  'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202510/t20251024_2004130.html',
]);

const report = await auditSourceUrls({
  manifest,
  requestUrl: async (url) => {
    if (url.includes('pep.com.cn')) {
      return { statusCode: 200, finalUrl: url };
    }
    throw new Error('timeout');
  },
});
assert.strictEqual(report.schemaVersion, ACCESS_AUDIT_SCHEMA_VERSION);
assert.strictEqual(report.status, 'blocked');
assert.deepStrictEqual(report.summary, {
  total: 2,
  checked: 2,
  passed: 1,
  failed: 1,
});
assert.strictEqual(report.urls[0].status, 'failed');
assert.strictEqual(report.urls[0].error, 'timeout');
assert.strictEqual(report.urls[1].status, 'passed');
assert.strictEqual(report.urls[1].httpStatus, 200);
assert.strictEqual(report.generatedFrom.sourceVersion, 'url-access-fixture-v1');
assert.match(report.generatedFrom.manifestHash, /^[a-f0-9]{64}$/);

const fallbackCalls = [];
const fallbackResponse = await requestSourceUrl('https://fixture.example/source', {
  timeoutMs: 50,
  fetchImpl: async (url, options) => {
    fallbackCalls.push(options.method);
    if (options.method === 'HEAD') return { status: 403, url, body: { cancel() {} } };
    return { status: 206, url: `${url}?range=0-0`, body: { cancel() {} } };
  },
});
assert.deepStrictEqual(fallbackCalls, ['HEAD', 'GET']);
assert.deepStrictEqual(fallbackResponse, {
  statusCode: 206,
  finalUrl: 'https://fixture.example/source?range=0-0',
});

const abortFallbackCalls = [];
const abortFallbackResponse = await requestSourceUrl('https://fixture.example/slow', {
  timeoutMs: 50,
  fetchImpl: async (url, options) => {
    abortFallbackCalls.push(options.method);
    if (options.method === 'HEAD') {
      const error = new Error('aborted');
      error.name = 'AbortError';
      throw error;
    }
    return { status: 200, url, body: { cancel() {} } };
  },
});
assert.deepStrictEqual(abortFallbackCalls, ['HEAD', 'GET']);
assert.deepStrictEqual(abortFallbackResponse, {
  statusCode: 200,
  finalUrl: 'https://fixture.example/slow',
});

const emptyReport = await auditSourceUrls({
  manifest: {
    ...manifest,
    batches: [{ id: 'math-chapters-v1.11', path: 'math.json', sourceKind: 'current-fixture' }],
  },
  requestUrl: async () => ({ statusCode: 200 }),
});
assert.strictEqual(emptyReport.status, 'no-sources');
assert.deepStrictEqual(emptyReport.summary, { total: 0, checked: 0, passed: 0, failed: 0 });

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'knows-source-url-access-'));
try {
  const manifestPath = path.join(tempDirectory, 'manifest.json');
  const reportPath = path.join(tempDirectory, 'report.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify({
    schemaVersion: 1,
    sourceVersion: 'cli-fixture-v1',
    sourceKind: 'current-fixture',
    batches: [{ id: 'math-chapters-v1.11', path: 'math.json', sourceKind: 'current-fixture' }],
  })}\n`);
  const checker = path.join(__dirname, 'check-content-source-url-access.js');
  const cli = spawnSync(process.execPath, [checker, manifestPath, '--report', reportPath], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
  });
  assert.strictEqual(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /NO-SOURCES content source URL access/);
  const strictCli = spawnSync(process.execPath, [
    checker,
    manifestPath,
    '--report',
    reportPath,
    '--require-accessible',
  ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.notStrictEqual(strictCli.status, 0);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

assert.throws(
  () => collectSourceUrls({
    ...manifest,
    batches: [{
      ...manifest.batches[0],
      sourceEvidence: {
        ...manifest.batches[0].sourceEvidence,
        sourceUrls: ['https://example.com/not-evidence'],
      },
    }],
  }),
  /占位|placeholder/i,
);

console.log('OK content source URL access contract');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
