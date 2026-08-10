const crypto = require('crypto');

const {
  isPlaceholderSourceUrl,
  normalizeBatchManifest,
} = require('./content-source-input-batches');

const ACCESS_AUDIT_SCHEMA_VERSION = 1;

function hashManifest(manifest) {
  return crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}

function collectSourceUrls(manifest) {
  const normalized = normalizeBatchManifest(manifest);
  const urls = new Set();
  normalized.batches.forEach((batch) => {
    const sourceUrls = batch.sourceEvidence && batch.sourceEvidence.sourceUrls;
    (sourceUrls || []).forEach((sourceUrl) => {
      if (isPlaceholderSourceUrl(sourceUrl)) {
        throw new Error(`来源 URL 使用占位域名：${sourceUrl}`);
      }
      urls.add(sourceUrl);
    });
  });
  return [...urls].sort();
}

function normalizeRequestResult(url, response) {
  const statusCode = Number(response && response.statusCode);
  if (!Number.isInteger(statusCode) || statusCode < 200 || statusCode >= 400) {
    return {
      url,
      status: 'failed',
      httpStatus: Number.isInteger(statusCode) ? statusCode : null,
      error: Number.isInteger(statusCode) ? `HTTP ${statusCode}` : '无效 HTTP 状态码',
    };
  }
  return {
    url,
    status: 'passed',
    httpStatus: statusCode,
    finalUrl: response.finalUrl || url,
  };
}

async function auditSourceUrls({ manifest, requestUrl } = {}) {
  if (typeof requestUrl !== 'function') {
    throw new Error('来源 URL 审计必须提供 requestUrl 函数');
  }
  const normalized = normalizeBatchManifest(manifest);
  const urls = collectSourceUrls(normalized);
  const results = [];
  for (const url of urls) {
    try {
      results.push(normalizeRequestResult(url, await requestUrl(url)));
    } catch (error) {
      results.push({
        url,
        status: 'failed',
        httpStatus: null,
        error: error.message || String(error),
      });
    }
  }
  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.length - passed;
  return {
    schemaVersion: ACCESS_AUDIT_SCHEMA_VERSION,
    status: failed ? 'blocked' : results.length ? 'passed' : 'no-sources',
    generatedFrom: {
      sourceVersion: normalized.sourceVersion,
      sourceKind: normalized.sourceKind,
      manifestHash: hashManifest(normalized),
    },
    summary: {
      total: results.length,
      checked: results.length,
      passed,
      failed,
    },
    urls: results,
  };
}

async function requestSourceUrl(url, { timeoutMs = 10000 } = {}) {
  if (typeof fetch !== 'function') throw new Error('当前 Node 运行时不支持 fetch');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        redirect: 'follow',
        signal: controller.signal,
      });
    }
    if (response.body && typeof response.body.cancel === 'function') response.body.cancel();
    return {
      statusCode: response.status,
      finalUrl: response.url || url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  ACCESS_AUDIT_SCHEMA_VERSION,
  auditSourceUrls,
  collectSourceUrls,
  requestSourceUrl,
};
